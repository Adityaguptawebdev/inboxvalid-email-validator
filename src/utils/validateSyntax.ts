/**
 * Deliberately simple syntax check rather than a full RFC 5322 parser:
 *   local-part@label(.label)*.tld
 * - local part / domain labels must start and end with an alphanumeric char
 * - "(?!.*\.\.)" rejects consecutive dots anywhere (catches "john..test@")
 * - the final label (TLD) must be 2+ letters, which also rejects domains
 *   with no dot at all (e.g. "john@gmail")
 */
const EMAIL_SYNTAX_REGEX =
  /^(?!.*\.\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export function isValidEmailSyntax(email: string): boolean {
  return EMAIL_SYNTAX_REGEX.test(email.trim());
}

export function extractDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}
