import { describe, expect, it } from "vitest";
import { isDisposableDomain } from "./disposableDomains";

describe("isDisposableDomain", () => {
  it("flags a known disposable domain", () => {
    expect(isDisposableDomain("mailinator.com")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isDisposableDomain("Mailinator.COM")).toBe(true);
  });

  it("does not flag a valid, non-disposable domain", () => {
    expect(isDisposableDomain("gmail.com")).toBe(false);
  });
});
