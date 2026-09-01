import { DISPOSABLE_DOMAINS } from "../data/disposableDomains.js";
import { KNOWN_MAIL_DOMAINS } from "../data/mailDomains.js";
import type { VerifyEmailResult } from "../types.js";

/**
 * Deliberately simple syntax check rather than a full RFC 5322 parser:
 *   local-part@label(.label)*.tld
 * - local part / labels must start and end with an alphanumeric character
 * - "(?!.*\.\.)" rejects consecutive dots anywhere (catches "john..test@")
 * - the final label (TLD) must be 2+ letters, which also rejects domains
 *   with no dot at all (e.g. "john@gmail")
 */
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

/**
 * Mocked stand-in for a real MX/DNS lookup — see data/mailDomains.ts.
 * Strict allow-list: a domain is only mail-capable if we explicitly know
 * it is. Any other domain — including one with an ordinary-looking TLD —
 * is not, since a real MX lookup would have no record for it either.
 */
export function checkMx(domain: string): boolean {
  return KNOWN_MAIL_DOMAINS.has(domain);
}

/**
 * Runs all three validation layers server-side. The frontend already runs
 * the syntax and disposable checks locally for instant feedback, but the
 * server never trusts the client — it recomputes everything so the API is
 * safe to call directly (e.g. from another service, or a malicious client
 * skipping the UI).
 */
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
