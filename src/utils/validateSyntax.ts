// Not a full RFC 5322 parser. (?!.*\.\.) rejects consecutive dots anywhere;
// requiring a final label.tld also rejects domains with no dot ("john@gmail").
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
