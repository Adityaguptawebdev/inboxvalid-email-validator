/**
 * Small, explicit list of well-known disposable/temporary email providers,
 * checked locally so obviously-unwanted addresses never reach the API. A
 * real product would back this with a maintained, regularly-updated
 * database instead of a hardcoded list — see README "What I Would
 * Improve Next".
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

export function isDisposableDomain(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}
