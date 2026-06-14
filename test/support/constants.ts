/**
 * The 60-minute "Psychic Reading" service — the only one bookable via the slot API,
 * because the slot endpoint requires a duration that is a multiple of 30 minutes.
 */
export const BOOKABLE_SERVICE_TYPE_ID = 12;

/** Timeout for asserting a UI `data-*` attribute that settles via client-side polling. */
export const UI_ATTR_TIMEOUT = 15_000;

/** Timeout for polling the database until a webhook-driven status change lands. */
export const DB_POLL_TIMEOUT = 10_000;
