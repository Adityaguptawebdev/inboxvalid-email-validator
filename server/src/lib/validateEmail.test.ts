import { describe, expect, it } from "vitest";
import { checkSyntax, extractDomain, checkDisposable, checkMx, validateEmailFull } from "./validateEmail.js";

describe("checkSyntax", () => {
  it("accepts valid emails", () => {
    expect(checkSyntax("john@gmail.com")).toBe(true);
    expect(checkSyntax("user@example.com")).toBe(true);
    expect(checkSyntax("john.doe+test@sub.example.com")).toBe(true);
  });

  it("rejects an email with no domain", () => {
    expect(checkSyntax("john@")).toBe(false);
  });

  it("rejects an email with no @", () => {
    expect(checkSyntax("john")).toBe(false);
  });

  it("rejects an email with no local part", () => {
    expect(checkSyntax("@gmail.com")).toBe(false);
  });

  it("rejects a domain with no TLD", () => {
    expect(checkSyntax("john@gmail")).toBe(false);
  });

  it("rejects consecutive dots in the local part", () => {
    expect(checkSyntax("john..test@gmail.com")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(checkSyntax("")).toBe(false);
    expect(checkSyntax("   ")).toBe(false);
  });
});

describe("extractDomain", () => {
  it("returns the lowercased domain", () => {
    expect(extractDomain("John@Gmail.COM")).toBe("gmail.com");
  });

  it("returns null when there is no @", () => {
    expect(extractDomain("john")).toBeNull();
  });
});

describe("checkDisposable", () => {
  it("flags known disposable domains", () => {
    expect(checkDisposable("mailinator.com")).toBe(true);
    expect(checkDisposable("tempmail.com")).toBe(true);
  });

  it("does not flag a normal domain", () => {
    expect(checkDisposable("gmail.com")).toBe(false);
  });
});

describe("checkMx", () => {
  it("trusts known mail providers", () => {
    expect(checkMx("gmail.com")).toBe(true);
  });

  it("rejects a domain not on the allow-list, even with a common TLD", () => {
    expect(checkMx("thisdomainprobablydoesnotexist12345.com")).toBe(false);
    expect(checkMx("some-startup.io")).toBe(false);
  });

  it("trusts the other known providers listed in the allow-list", () => {
    expect(checkMx("outlook.com")).toBe(true);
    expect(checkMx("hotmail.com")).toBe(true);
  });
});

describe("validateEmailFull", () => {
  it("returns valid for a well-formed, non-disposable, mail-capable email", () => {
    const result = validateEmailFull("john@gmail.com");
    expect(result.status).toBe("valid");
    expect(result.checks).toEqual({ syntax: true, disposable: false, mx: true });
  });

  it("returns invalid with syntax:false for malformed input", () => {
    const result = validateEmailFull("john@gmail");
    expect(result.status).toBe("invalid");
    expect(result.checks.syntax).toBe(false);
  });

  it("returns invalid with disposable:true for a disposable domain", () => {
    const result = validateEmailFull("test@mailinator.com");
    expect(result.status).toBe("invalid");
    expect(result.checks).toEqual({ syntax: true, disposable: true, mx: false });
    expect(result.reason).toMatch(/disposable/i);
  });

  it("returns invalid with mx:false for a domain with no mock MX record", () => {
    const result = validateEmailFull("john@notarealdomain.com");
    expect(result.status).toBe("invalid");
    expect(result.checks).toEqual({ syntax: true, disposable: false, mx: false });
  });

  it("returns invalid for a syntactically valid but unrecognized domain (regression)", () => {
    const result = validateEmailFull("test@thisdomainprobablydoesnotexist12345.com");
    expect(result.status).toBe("invalid");
    expect(result.checks).toEqual({ syntax: true, disposable: false, mx: false });
    expect(result.reason).toBe("Domain does not appear to accept email.");
  });
});
