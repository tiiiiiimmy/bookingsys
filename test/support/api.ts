import type { Page } from '@playwright/test';
import { env } from './env.js';

export type AdminTokens = { accessToken: string; refreshToken: string };

type RequestOptions = { method?: string; token?: string; body?: unknown };

/** Build a request to the API: joins the path, sets JSON + optional bearer, and serializes the body. */
export function apiFetch(path: string, opts: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  return fetch(`${env.apiUrl}${path}`, {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

/** Like apiFetch but throws on a non-OK response and returns the unwrapped `data` payload. */
export async function apiJson<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await apiFetch(path, opts);
  if (!res.ok) {
    const method = opts.method ?? (opts.body !== undefined ? 'POST' : 'GET');
    throw new Error(`${method} ${path} failed: ${res.status} ${await res.text()}`);
  }
  const body = await res.json();
  return (body?.data ?? body) as T;
}

/** Authenticate as an admin via the API and return both tokens. */
export async function adminLoginTokens(
  email = env.admin.email,
  password = env.admin.password,
): Promise<AdminTokens> {
  const data = await apiJson<Partial<AdminTokens>>('/admin/auth/login', { body: { email, password } });
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
export function approveRescheduleRequestRaw(
  token: string,
  requestId: number,
  adminNote = 'approved by e2e',
): Promise<Response> {
  return apiFetch(`/admin/reschedule-requests/${requestId}/approve`, { token, body: { adminNote } });
}

/** Reject a reschedule request, returning the raw response. */
export function rejectRescheduleRequest(
  token: string,
  requestId: number,
  adminNote = 'rejected by e2e',
): Promise<Response> {
  return apiFetch(`/admin/reschedule-requests/${requestId}/reject`, { token, body: { adminNote } });
}

/** Exchange a refresh token for a new access token (raw response). */
export function refreshAccessToken(refreshToken: string): Promise<Response> {
  return apiFetch('/admin/auth/refresh', { body: { refreshToken } });
}

/** GET /admin/bookings with auth + query params; returns the `data` array. */
export function adminGetBookings(token: string, params: Record<string, string> = {}): Promise<any[]> {
  const query = new URLSearchParams(params).toString();
  return apiJson<any[]>(`/admin/bookings${query ? `?${query}` : ''}`, { token });
}

export type AvailableSlot = { startTime: string; endTime: string };

/** Public availability for a date (raw response) — for slot-validation negatives. */
export function getSlotsResponse(date: string, duration: number): Promise<Response> {
  return apiFetch(`/availability/slots?date=${date}&duration=${duration}`);
}

/** Public availability slots for a date; throws on non-OK. */
export async function getAvailableSlots(date: string, duration: number): Promise<AvailableSlot[]> {
  const data = await apiJson<{ slots?: AvailableSlot[] }>(`/availability/slots?date=${date}&duration=${duration}`);
  return data?.slots ?? [];
}

/** Attempt to create a booking via the public API (raw response) — for conflict/409 assertions. */
export function bookSlotViaApi(input: {
  email: string;
  startTime: string;
  endTime: string;
  serviceTypeId: number;
}): Promise<Response> {
  return apiFetch('/bookings', {
    body: {
      serviceTypeId: input.serviceTypeId,
      slots: [{ startTime: input.startTime, endTime: input.endTime }],
      customer: { firstName: 'Test', lastName: 'Customer', email: input.email, phone: '0211234567' },
    },
  });
}

/** Create an availability block via the admin API; returns the created block (with id). */
export function createAvailabilityBlock(
  token: string,
  startTime: string,
  endTime: string,
  reason = 'e2e block',
): Promise<{ id: number }> {
  return apiJson<{ id: number }>('/availability/admin/blocks', {
    token,
    body: { startTime, endTime, blockType: 'blocked', reason },
  });
}

/** Delete an availability block via the admin API (raw response, for missing-block negatives). */
export function deleteAvailabilityBlock(token: string, id: number): Promise<Response> {
  return apiFetch(`/availability/admin/blocks/${id}`, { method: 'DELETE', token });
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
