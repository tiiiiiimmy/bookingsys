import { runBackendCommand } from './backend.js';
import { closeDb } from './db.js';

/**
 * Runs once before the suite (and before the webServers start): migrate + seed
 * the isolated test DB so the baseline data (admin, service types, business
 * hours) exists. The backend/frontend dev servers are started by the
 * playwright.config webServer entries.
 */
export default async function globalSetup() {
  await runBackendCommand('--migrate');
  await runBackendCommand('--seed');
  await closeDb();
}
