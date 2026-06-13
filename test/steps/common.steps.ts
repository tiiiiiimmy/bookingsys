import { After, AfterAll } from '../support/fixtures.js';
import { cleanupCustomer, closeDb } from '../support/db.js';

// Per-scenario teardown: remove the unique customer this scenario created.
After(async ({ customerEmail }) => {
  await cleanupCustomer(customerEmail);
});

AfterAll(async () => {
  await closeDb();
});
