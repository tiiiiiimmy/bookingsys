import { runBackendCommand, waitForUrl } from './backend.js';
import { env } from './env.js';
import { closeDb } from './db.js';

/**
 * Runs once before the suite: migrate + seed the isolated app_test DB, then
 * verify the backend and frontend are reachable. The backend and frontend dev
 * servers themselves are started by playwright.config webServer entries.
 */
export default async function globalSetup() {
  await runBackendCommand('--migrate');
  await runBackendCommand('--seed');
  await waitForUrl(`${env.apiUrl}/bookings/service-types`);
  await waitForUrl(env.baseUrl);
  await closeDb();
}
