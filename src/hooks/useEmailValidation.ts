import { useEffect, useRef, useState } from "react";
import { isValidEmailSyntax, extractDomain } from "../utils/validateSyntax";
import { isDisposableDomain } from "../utils/disposableDomains";
import { verifyEmailRemote } from "../services/emailApi";
import { INITIAL_EMAIL_VALIDATION_RESULT, type EmailValidationResult } from "../types/email";

/**
 * Short debounce (well under the assignment's ~200ms perceived-latency
 * target) because the two cheap local checks that run first — syntax and
 * disposable-domain — are synchronous and instant. Only emails that pass
 * both ever trigger a network request, so most keystrokes never reach the
 * API at all.
 */
const DEBOUNCE_MS = 120;

/**
 * Runs the three-layer validation pipeline (syntax -> disposable ->
 * mock MX API) against `email`, debounced, and returns the latest result.
 *
 * Kept separate from EmailValidator.tsx so the state machine and network
 * logic can be tested and reasoned about independently of any UI markup.
 */
export function useEmailValidation(email: string): EmailValidationResult {
  const trimmed = email.trim();
  // Holds only the outcome of the debounced/async pipeline below. The
  // "empty" case is derived directly from `trimmed` at the bottom of this
  // hook instead of being pushed through an effect+setState, so clearing
  // the field resets the UI instantly rather than waiting on the debounce.
  const [asyncResult, setAsyncResult] = useState<EmailValidationResult>(
    INITIAL_EMAIL_VALIDATION_RESULT,
  );
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // A new value supersedes whatever the previous run was doing.
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
