/**
 * Mocked domain intelligence for the "MX-style plausibility" check.
 *
 * We don't perform a real DNS/MX lookup (see README "Trade-offs"). Instead
 * we use a strict allow-list: only domains we know are mail-capable pass.
 * Any domain not on this list — including ones that merely have a
 * plausible-looking TLD — is treated as not mail-capable. A real MX
 * lookup is a positive check ("this domain has a mail server"), not a
 * guess based on how the domain is spelled, so the mock should behave the
 * same way: no signal in our data means "no", not "probably".
 */
export const KNOWN_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "protonmail.com",
  "proton.me",
  "aol.com",
  "zoho.com",
  "gmx.com",
  "yandex.com",
  "example.com",
  "inboxvalid.ai",
]);
