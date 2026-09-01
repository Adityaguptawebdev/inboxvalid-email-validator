// Shape of the /api/verify-email contract. Mirrored (simplified) on the
// frontend in src/types/email.ts rather than a shared package — see README.
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
