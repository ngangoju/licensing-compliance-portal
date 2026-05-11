import { describe, expect, it } from "vitest";
import { isBnrRole, roleHomePath } from "@/lib/auth-shared";

describe("auth helpers", () => {
  it("routes applicants to the applicant workspace", () => {
    expect(roleHomePath("APPLICANT")).toBe("/applicant/dashboard");
  });

  it("routes BNR staff to the BNR workspace", () => {
    expect(roleHomePath("LEGAL_OFFICER")).toBe("/bnr/dashboard");
  });

  it("identifies internal BNR roles", () => {
    expect(isBnrRole("AUDITOR")).toBe(true);
    expect(isBnrRole("APPLICANT")).toBe(false);
  });
});
