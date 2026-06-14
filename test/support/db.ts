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
