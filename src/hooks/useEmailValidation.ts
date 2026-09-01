import { useEffect, useRef, useState } from "react";
import { isValidEmailSyntax, extractDomain } from "../utils/validateSyntax";
import { isDisposableDomain } from "../utils/disposableDomains";
import { verifyEmailRemote } from "../services/emailApi";
import { INITIAL_EMAIL_VALIDATION_RESULT, type EmailValidationResult } from "../types/email";

// 120ms is enough — the local checks below are synchronous, so the
// debounce only has to absorb typing, not network latency.
const DEBOUNCE_MS = 120;

// State machine for the syntax -> disposable -> mock MX pipeline. Kept
// out of EmailValidator.tsx so it's testable without rendering anything.
export function useEmailValidation(email: string): EmailValidationResult {
  const trimmed = email.trim();
  // Empty case is derived below instead of set here, so clearing the
  // field resets instantly instead of waiting on the debounce.
  const [asyncResult, setAsyncResult] = useState<EmailValidationResult>(
    INITIAL_EMAIL_VALIDATION_RESULT,
  );
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (!trimmed) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      void runValidation();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };

    async function runValidation() {
      // Layer 1: syntax — local, synchronous, no API call.
      if (!isValidEmailSyntax(trimmed)) {
        setAsyncResult({
          status: "invalid",
          message: "Please enter a valid email address.",
          canSubmit: false,
        });
        return;
      }

      // Layer 2: disposable domain — local, synchronous, no API call.
      const domain = extractDomain(trimmed);
      if (domain && isDisposableDomain(domain)) {
        setAsyncResult({
          status: "invalid",
          message: "Disposable email addresses are not allowed.",
          canSubmit: false,
        });
        return;
      }

      // Layer 3: mock MX plausibility check via the API.
      setAsyncResult({ status: "checking", message: "Checking email...", canSubmit: false });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await verifyEmailRemote(trimmed, controller.signal);
        if (cancelled) return;

        setAsyncResult({
          status: response.status,
          message: response.status === "valid" ? "Email looks good!" : response.reason,
          checks: response.checks,
          canSubmit: response.status === "valid",
        });
      } catch (error) {
        if (cancelled) return;

        // Fail open: a network/API failure must never block the user.
        console.warn("Email verification request failed; failing open.", error);
        setAsyncResult({
          status: "unreachable",
          message: "Unable to verify right now. You can continue.",
          canSubmit: true,
        });
      }
    }
  }, [trimmed]);

  return trimmed ? asyncResult : INITIAL_EMAIL_VALIDATION_RESULT;
}
