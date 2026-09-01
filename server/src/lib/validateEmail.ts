import { DISPOSABLE_DOMAINS } from "../data/disposableDomains.js";
import { KNOWN_MAIL_DOMAINS } from "../data/mailDomains.js";
import type { VerifyEmailResult } from "../types.js";

// Not a full RFC 5322 parser. (?!.*\.\.) rejects consecutive dots anywhere;
// requiring a final label.tld also rejects domains with no dot ("john@gmail").
const EMAIL_SYNTAX_REGEX =
  /^(?!.*\.\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export function checkSyntax(email: string): boolean {
  return EMAIL_SYNTAX_REGEX.test(email.trim());
}

export function extractDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

export function checkDisposable(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain);
}

// Mocked stand-in for a real MX/DNS lookup — see data/mailDomains.ts.
export function checkMx(domain: string): boolean {
  return KNOWN_MAIL_DOMAINS.has(domain);
}

// Re-runs all three layers server-side — never trusts that the client
// already did this, so the API is safe to call directly.
export function validateEmailFull(rawEmail: string): VerifyEmailResult {
  const email = rawEmail.trim().toLowerCase();
  const syntax = checkSyntax(email);

  if (!syntax) {
    return {
      status: "invalid",
      reason: "Email address format looks incorrect.",
      checks: { syntax: false, disposable: false, mx: false },
    };
  }

  const domain = extractDomain(email) as string; // non-null: syntax passed
  const disposable = checkDisposable(domain);

  if (disposable) {
    return {
      status: "invalid",
      reason: "Disposable email addresses are not allowed.",
      checks: { syntax: true, disposable: true, mx: false },
    };
  }

  const mx = checkMx(domain);

  if (!mx) {
    return {
      status: "invalid",
      reason: "Domain does not appear to accept email.",
      checks: { syntax: true, disposable: false, mx: false },
    };
  }

  return {
    status: "valid",
    reason: "Email domain appears mail-capable.",
    checks: { syntax: true, disposable: false, mx: true },
  };
}
