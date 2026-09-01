import type { VerifyEmailResponse } from "../types/email";

const API_ENDPOINT = "/api/verify-email";
const REQUEST_TIMEOUT_MS = 5000;

// Normalizes every failure mode into one error type so callers can just
// have a single fail-open catch block instead of branching on cause.
export class EmailApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailApiError";
  }
}

function isValidResponseShape(data: unknown): data is VerifyEmailResponse {
  if (typeof data !== "object" || data === null) return false;
  const candidate = data as Partial<VerifyEmailResponse>;
  return (
    (candidate.status === "valid" || candidate.status === "invalid") &&
    typeof candidate.reason === "string" &&
    typeof candidate.checks === "object" &&
    candidate.checks !== null &&
    typeof candidate.checks.syntax === "boolean" &&
    typeof candidate.checks.disposable === "boolean" &&
    typeof candidate.checks.mx === "boolean"
  );
}

// Always throws EmailApiError on failure — never a "best guess" result —
// so useEmailValidation is the single place that decides to fail open.
export async function verifyEmailRemote(
  email: string,
  signal?: AbortSignal,
): Promise<VerifyEmailResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort());

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new EmailApiError(`Verification request failed with status ${response.status}.`);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new EmailApiError("Verification API returned invalid JSON.");
    }

    if (!isValidResponseShape(data)) {
      throw new EmailApiError("Verification API returned an unexpected response shape.");
    }

    return data;
  } catch (error) {
    if (error instanceof EmailApiError) throw error;
    throw new EmailApiError(error instanceof Error ? error.message : "Unknown network error.");
  } finally {
    clearTimeout(timeoutId);
  }
}
