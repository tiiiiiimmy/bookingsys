import mysql from 'mysql2/promise';
import { env } from './env.js';

let pool: mysql.Pool | undefined;

export function db(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      database: env.db.database,
      user: env.db.user,
      password: env.db.password,
      connectionLimit: 5,
    });
  }
  return pool;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const [rows] = await db().query(sql, params);
  return (rows as T[])[0];
}

/**
 * Format a Date as a naive 'YYYY-MM-DD HH:mm:ss' string in the process's LOCAL time.
 * The backend stores/compares `expires_at` via C# `DateTime.Now` (local wall clock), so seeded
 * holds must use local time too — MySQL `NOW()` here runs in UTC and would read as already expired.
 */
function formatLocalDateTime(date: Date): string {
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/** Latest booking for a customer email, joined with its payment status. */
export async function getBookingByEmail(email: string) {
  return queryOne<{ id: number; status: string; payment_status: string | null }>(
    `SELECT b.id, b.status, p.status AS payment_status
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       LEFT JOIN payments p ON p.booking_id = b.id
      WHERE c.email = ?
      ORDER BY b.id DESC
      LIMIT 1`,
    [email],
  );
}

/** Latest reschedule request for a booking. */
export async function getRescheduleRequestByBookingId(bookingId: number) {
  return queryOne<{ id: number; status: string }>(
    `SELECT id, status FROM booking_reschedule_requests WHERE booking_id = ? ORDER BY id DESC LIMIT 1`,
    [bookingId],
  );
}

/** All reschedule requests for a booking (newest first) — for multi-pending assertions. */
export async function getRescheduleRequestsByBookingId(bookingId: number) {
  const [rows] = await db().query(
    `SELECT id, status FROM booking_reschedule_requests WHERE booking_id = ? ORDER BY id DESC`,
    [bookingId],
  );
  return rows as Array<{ id: number; status: string }>;
}

/** All bookings for a customer email (oldest first) — for group/multi-slot assertions. */
export async function getBookingsByEmail(email: string) {
  const [rows] = await db().query(
    `SELECT b.id, b.status, b.start_time
       FROM bookings b JOIN customers c ON c.id = b.customer_id
      WHERE c.email = ?
      ORDER BY b.id ASC`,
    [email],
  );
  return rows as Array<{ id: number; status: string; start_time: string }>;
}

/** Raw booking status + cancellation reason — for expiry/conflict (cancelled) assertions. */
export async function getBookingStatusReason(bookingId: number) {
  return queryOne<{ status: string; cancellation_reason: string | null }>(
    `SELECT status, cancellation_reason FROM bookings WHERE id = ?`,
    [bookingId],
  );
}

/** Force a pending booking's hold to be expired (so a later succeeded webhook cancels it). */
export async function expireBookingHold(bookingId: number): Promise<void> {
  // Local wall-clock past time, matching the backend's DateTime.Now-based IsExpired check.
  const expiredAt = formatLocalDateTime(new Date(Date.now() - 60 * 60_000));
  await db().query('UPDATE bookings SET expires_at = ? WHERE id = ?', [expiredAt, bookingId]);
}

/**
 * Directly seed a booking (+ payment) for a customer email, to create a pre-existing
 * conflict/hold at a slot. Uses the same email convention so `cleanupCustomer` removes it.
 * `startTime`/`endTime` are MySQL DATETIME strings ('YYYY-MM-DD HH:mm:ss'); price/duration are
 * derived from the service type and the time range. `holdMinutes` sets `expires_at`
 * (null => NULL, i.e. no hold window — used for confirmed seeds).
 */
async function seedBooking(input: {
  email: string;
  startTime: string;
  endTime: string;
  serviceTypeId: number;
  technicianId?: number | null;
  status: 'confirmed' | 'pending';
  paymentStatus: 'succeeded' | 'pending';
  paymentIntentId: string;
  holdMinutes: number | null;
}): Promise<{ bookingId: number; customerId: number }> {
  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();

    const [custRows] = await conn.query('SELECT id FROM customers WHERE email = ? LIMIT 1', [input.email]);
    let customerId: number;
    if ((custRows as Array<{ id: number }>).length > 0) {
      customerId = (custRows as Array<{ id: number }>)[0].id;
    } else {
      const [ins] = await conn.query(
        'INSERT INTO customers (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
        ['Seed', 'Customer', input.email, '0000000000'],
      );
      customerId = (ins as { insertId: number }).insertId;
    }

    const durationMinutes = Math.round((Date.parse(input.endTime) - Date.parse(input.startTime)) / 60_000);
    const svc = await queryOne<{ price_cents: number }>(
      'SELECT price_cents FROM service_types WHERE id = ?',
      [input.serviceTypeId],
    );
    const priceCents = svc?.price_cents ?? 0;
    const manageToken = `seed-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    // Use a LOCAL wall-clock expiry so it matches the backend's DateTime.Now-based IsExpired check.
    const expiresAt =
      input.holdMinutes === null ? null : formatLocalDateTime(new Date(Date.now() + input.holdMinutes * 60_000));

    const [bk] = await conn.query(
      `INSERT INTO bookings
         (customer_id, service_type_id, technician_id, start_time, end_time, duration_minutes, status, price_cents, manage_token, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerId, input.serviceTypeId, input.technicianId ?? null, input.startTime, input.endTime, durationMinutes, input.status, priceCents, manageToken, expiresAt],
    );
    const bookingId = (bk as { insertId: number }).insertId;

    await conn.query(
      `INSERT INTO payments (booking_id, stripe_payment_intent_id, amount_cents, currency, status)
       VALUES (?, ?, ?, 'usd', ?)`,
      [bookingId, input.paymentIntentId, priceCents, input.paymentStatus],
    );

    await conn.commit();
    return { bookingId, customerId };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/** Seed a confirmed booking with a succeeded payment (pre-existing conflict at a slot). */
export async function insertConfirmedBooking(input: {
  email: string;
  startTime: string;
  endTime: string;
  serviceTypeId: number;
  technicianId?: number | null;
}): Promise<{ bookingId: number; customerId: number }> {
  return seedBooking({
    ...input,
    status: 'confirmed',
    paymentStatus: 'succeeded',
    paymentIntentId: `pi_seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    holdMinutes: null,
  });
}

/**
 * Seed a pending booking with a live 30-minute hold and a pending payment whose intent id is
 * `paymentIntentId`, so a forged succeeded/failed webhook can drive it (concurrency/expiry tests).
 */
export async function insertPendingBooking(input: {
  email: string;
  startTime: string;
  endTime: string;
  serviceTypeId: number;
  paymentIntentId: string;
  technicianId?: number | null;
}): Promise<{ bookingId: number; customerId: number }> {
  return seedBooking({
    ...input,
    status: 'pending',
    paymentStatus: 'pending',
    holdMinutes: 30,
  });
}

/** Manage token for the latest booking of a customer email. */
export async function getManageToken(email: string) {
  return queryOne<{ manage_token: string }>(
    `SELECT b.manage_token FROM bookings b JOIN customers c ON c.id = b.customer_id
      WHERE c.email = ? ORDER BY b.id DESC LIMIT 1`,
    [email],
  );
}

/** Latest product order for a customer email. */
export async function getProductOrderByEmail(email: string) {
  return queryOne<{ id: number; status: string }>(
    `SELECT id, status FROM product_orders WHERE customer_email = ? ORDER BY id DESC LIMIT 1`,
    [email],
  );
}

/** Remove product orders created by a test customer email. */
export async function cleanupProductOrder(email: string): Promise<void> {
  await db().query('DELETE FROM product_orders WHERE customer_email = ?', [email]);
}

/** Remove all data created by a test customer email (cascade-safe order). */
export async function cleanupCustomer(email: string): Promise<void> {
  const customer = await queryOne<{ id: number }>('SELECT id FROM customers WHERE email = ?', [email]);
  if (!customer) return;
  await db().query(
    'DELETE p FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE b.customer_id = ?',
    [customer.id],
  );
  await db().query(
    'DELETE FROM booking_reschedule_requests WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id = ?)',
    [customer.id],
  );
  await db().query('DELETE FROM bookings WHERE customer_id = ?', [customer.id]);
  await db().query('DELETE FROM customers WHERE id = ?', [customer.id]);
}
