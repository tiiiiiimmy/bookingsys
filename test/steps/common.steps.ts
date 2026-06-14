import { After, AfterAll } from '../support/fixtures.js';
import { cleanupCustomer, cleanupProductOrder, closeDb } from '../support/db.js';

// Per-scenario teardown: remove the unique customer/order this scenario created.
After(async ({ customerEmail }) => {
  await cleanupProductOrder(customerEmail);
  await cleanupCustomer(customerEmail);
});

AfterAll(async () => {
  await closeDb();
});
