/**
 * Shared shape of the /api/verify-email contract.
 *
 * This is intentionally duplicated (in a simplified form) on the frontend
 * in src/types/email.ts rather than pulled from a shared workspace package.
 * See the README "Trade-offs" section for why that's an acceptable
 * trade-off at this project's scope.
 */

export interface EmailChecks {
  syntax: boolean;
  disposable: boolean;
  mx: boolean;
}

export type VerificationStatus = "valid" | "invalid";

export interface VerifyEmailResult {
  status: VerificationStatus;
  reason: string;
  checks: EmailChecks;
}

export interface VerifyEmailRequestBody {
  email?: unknown;
}
