/**
 * A simplified, frontend-facing mirror of server/src/types.ts. Kept as a
 * separate copy rather than a shared package — see README "Trade-offs".
 */
export interface EmailChecks {
  syntax: boolean;
  disposable: boolean;
  mx: boolean;
}

export type VerificationStatus = "valid" | "invalid";

export interface VerifyEmailResponse {
  status: VerificationStatus;
  reason: string;
  checks: EmailChecks;
}

/** The five UI states the email widget can be in. */
export type EmailValidationStatus =
  | "idle"
  | "checking"
  | "valid"
  | "invalid"
  | "unreachable";

export interface EmailValidationResult {
  status: EmailValidationStatus;
  message: string;
  checks?: EmailChecks;
  /**
   * Whether a form using this widget is allowed to submit given this
   * result. True for "valid" and for "unreachable" (fail-open), false
   * otherwise.
   */
  canSubmit: boolean;
}

export const INITIAL_EMAIL_VALIDATION_RESULT: EmailValidationResult = {
  status: "idle",
  message: "Enter your email address",
  canSubmit: false,
};
