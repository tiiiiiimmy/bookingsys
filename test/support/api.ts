import type { Page } from '@playwright/test';
import { env } from './env.js';

export type AdminTokens = { accessToken: string; refreshToken: string };

/** Authenticate as an admin via the API and return both tokens. */
export async function adminLoginTokens(
  email = env.admin.email,
  password = env.admin.password,
): Promise<AdminTokens> {
  const res = await fetch(`${env.apiUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Admin login failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  const data = body?.data ?? body;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error('Missing accessToken/refreshToken in admin login response');
  }
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

/** Backwards-compatible: authenticate and return only the access token. */
export async function adminLogin(email = env.admin.email, password = env.admin.password): Promise<string> {
  return (await adminLoginTokens(email, password)).accessToken;
}

/** Approve a reschedule request via the same endpoint the admin UI calls (throws on non-OK). */
export async function approveRescheduleRequest(
  token: string,
  requestId: number,
  adminNote = 'approved by e2e',
): Promise<void> {
  const res = await approveRescheduleRequestRaw(token, requestId, adminNote);
  if (!res.ok) throw new Error(`Approve reschedule failed: ${res.status} ${await res.text()}`);
}

/** Approve a reschedule request, returning the raw response (for already-reviewed/conflict assertions). */
export async function approveRescheduleRequestRaw(
  token: string,
  requestId: number,
  adminNote = 'approved by e2e',
): Promise<Response> {
  return fetch(`${env.apiUrl}/admin/reschedule-requests/${requestId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ adminNote }),
  });
}

/** Reject a reschedule request, returning the raw response. */
export async function rejectRescheduleRequest(
  token: string,
  requestId: number,
  adminNote = 'rejected by e2e',
): Promise<Response> {
  return fetch(`${env.apiUrl}/admin/reschedule-requests/${requestId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ adminNote }),
  });
}

/** Exchange a refresh token for a new access token (raw response). */
export async function refreshAccessToken(refreshToken: string): Promise<Response> {
  return fetch(`${env.apiUrl}/admin/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
}

/** GET /admin/bookings with auth + query params; returns the `data` array. */
export async function adminGetBookings(
  token: string,
  params: Record<string, string> = {},
): Promise<any[]> {
  const query = new URLSearchParams(params).toString();
  const url = `${env.apiUrl}/admin/bookings${query ? `?${query}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`GET admin bookings failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return body?.data ?? body;
}

export type AvailableSlot = { startTime: string; endTime: string };

/** Public availability for a date (raw response) — for slot-validation negatives. */
export async function getSlotsResponse(date: string, duration: number): Promise<Response> {
  return fetch(`${env.apiUrl}/availability/slots?date=${date}&duration=${duration}`);
}

/** Public availability slots for a date; throws on non-OK. */
export async function getAvailableSlots(date: string, duration: number): Promise<AvailableSlot[]> {
  const res = await getSlotsResponse(date, duration);
  if (!res.ok) throw new Error(`GET availability slots failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return (body?.data ?? body)?.slots ?? [];
}

/** Create an availability block via the admin API; returns the created block (with id). */
export async function createAvailabilityBlock(
  token: string,
  startTime: string,
  endTime: string,
  reason = 'e2e block',
): Promise<{ id: number }> {
  const res = await fetch(`${env.apiUrl}/availability/admin/blocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ startTime, endTime, blockType: 'blocked', reason }),
  });
  if (!res.ok) throw new Error(`Create availability block failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return body?.data ?? body;
}

/** Delete an availability block via the admin API (raw response, for missing-block negatives). */
export async function deleteAvailabilityBlock(token: string, id: number): Promise<Response> {
  return fetch(`${env.apiUrl}/availability/admin/blocks/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Seed an authenticated admin session into a browser page so the app boots logged in
 * (skips the UI login screen). Writes both tokens into localStorage via addInitScript,
 * which re-applies on every navigation. Keys are `accessToken` / `refreshToken`
 * (matching AuthContext + api.js).
 */
export async function seedAdminAuthInBrowser(page: Page, tokens?: AdminTokens): Promise<void> {
  const { accessToken, refreshToken } = tokens ?? (await adminLoginTokens());
  await page.addInitScript(
    ([a, r]) => {
      localStorage.setItem('accessToken', a);
      localStorage.setItem('refreshToken', r);
    },
    [accessToken, refreshToken],
  );
}
