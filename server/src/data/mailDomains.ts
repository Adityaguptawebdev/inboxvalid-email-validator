// Mocked MX check — strict allow-list, no real DNS lookup (see README).
// Anything not listed is treated as not mail-capable, even with a normal TLD.
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
