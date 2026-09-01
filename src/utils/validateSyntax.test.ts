import { describe, expect, it } from "vitest";
import { isValidEmailSyntax, extractDomain } from "./validateSyntax";

describe("isValidEmailSyntax", () => {
  it("accepts a standard valid email", () => {
    expect(isValidEmailSyntax("john@gmail.com")).toBe(true);
  });

  it("accepts another valid domain", () => {
    expect(isValidEmailSyntax("user@example.com")).toBe(true);
  });

  it("rejects an email with no domain (missing @ target)", () => {
    expect(isValidEmailSyntax("john@")).toBe(false);
  });

  it("rejects an email missing @ entirely", () => {
    expect(isValidEmailSyntax("john")).toBe(false);
  });

  it("rejects an email missing the local part", () => {
    expect(isValidEmailSyntax("@gmail.com")).toBe(false);
  });

  it("rejects a domain with no TLD", () => {
    expect(isValidEmailSyntax("john@gmail")).toBe(false);
  });

  it("rejects consecutive dots in the local part", () => {
    expect(isValidEmailSyntax("john..test@gmail.com")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isValidEmailSyntax("")).toBe(false);
    expect(isValidEmailSyntax("   ")).toBe(false);
  });
});

describe("extractDomain", () => {
  it("extracts and lowercases the domain", () => {
    expect(extractDomain("John@Gmail.COM")).toBe("gmail.com");
  });

  it("returns null when there is no @", () => {
    expect(extractDomain("john")).toBeNull();
  });

  it("returns null when the domain is empty", () => {
    expect(extractDomain("john@")).toBeNull();
  });
});
