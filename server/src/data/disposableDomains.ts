/**
 * Small, explicit list of well-known disposable/temporary email providers.
 *
 * A real product would back this with a maintained, regularly-updated
 * database (there are open-source lists with thousands of entries), but a
 * short in-memory list is enough to demonstrate the check end-to-end here.
 */
export const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "getnada.com",
  "fakeinbox.com",
  "dispostable.com",
  "maildrop.cc",
  "sharklasers.com",
]);
