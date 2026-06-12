import { describe, expect, it } from "vitest";
import { resolveSchoolRouteAccess } from "./schoolRouteAccess";

describe("resolveSchoolRouteAccess", () => {
  it("blocks unauthenticated access", () => {
    expect(resolveSchoolRouteAccess({ accessToken: "", role: "" })).toBe("login");
    expect(resolveSchoolRouteAccess({ accessToken: "tok", role: "" })).toBe("login");
  });

  it("blocks teacher", () => {
    expect(
      resolveSchoolRouteAccess({ accessToken: "tok", role: "teacher" })
    ).toBe("denied");
  });

  it("blocks student", () => {
    expect(
      resolveSchoolRouteAccess({ accessToken: "tok", role: "student" })
    ).toBe("denied");
  });

  it("allows school_admin", () => {
    expect(
      resolveSchoolRouteAccess({ accessToken: "tok", role: "school_admin" })
    ).toBe("allow");
  });
});
