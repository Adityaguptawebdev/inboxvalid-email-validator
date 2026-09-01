import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyEmailRemote, EmailApiError } from "./emailApi";

function mockFetchOnce(response: Partial<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      ...response,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("verifyEmailRemote", () => {
  it("resolves with the parsed result on a valid 200 response", async () => {
    mockFetchOnce({
      json: async () => ({
        status: "valid",
        reason: "Email domain appears mail-capable.",
        checks: { syntax: true, disposable: false, mx: true },
      }),
    });

    const result = await verifyEmailRemote("john@gmail.com");
    expect(result.status).toBe("valid");
    expect(result.checks.mx).toBe(true);
  });

  it("throws EmailApiError when the network request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(verifyEmailRemote("john@gmail.com")).rejects.toBeInstanceOf(EmailApiError);
  });

  it("throws EmailApiError on a non-2xx status", async () => {
    mockFetchOnce({ ok: false, status: 500 });

    await expect(verifyEmailRemote("john@gmail.com")).rejects.toBeInstanceOf(EmailApiError);
  });

  it("throws EmailApiError when the response shape is unexpected", async () => {
    mockFetchOnce({ json: async () => ({ unexpected: true }) });

    await expect(verifyEmailRemote("john@gmail.com")).rejects.toBeInstanceOf(EmailApiError);
  });
});
