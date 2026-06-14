import { env } from './env.js';

/** Authenticate as an admin via the API and return the access token. */
export async function adminLogin(email = 'admin@massage.com', password = 'admin123'): Promise<string> {
  const res = await fetch(`${env.apiUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Admin login failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  const token = body?.data?.accessToken ?? body?.accessToken;
  if (!token) throw new Error('No accessToken in admin login response');
  return token;
}

/** Approve a reschedule request via the same endpoint the admin UI calls. */
export async function approveRescheduleRequest(
  token: string,
  requestId: number,
  adminNote = 'approved by e2e',
): Promise<void> {
  const res = await fetch(`${env.apiUrl}/admin/reschedule-requests/${requestId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ adminNote }),
  });
  if (!res.ok) throw new Error(`Approve reschedule failed: ${res.status} ${await res.text()}`);
}
