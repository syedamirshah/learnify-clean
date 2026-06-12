import { describe, expect, it } from "vitest";
import {
  getDefaultRouteForRole,
  resolvePostLoginPath,
  shouldRedirectFromLearn,
} from "./roleRoutes";

describe("getDefaultRouteForRole", () => {
  it("routes school_admin to school dashboard", () => {
    expect(getDefaultRouteForRole("school_admin")).toBe("/school/dashboard");
  });

  it("routes teacher to teacher dashboard", () => {
    expect(getDefaultRouteForRole("teacher")).toBe("/teacher/dashboard");
  });

  it("routes student to learn", () => {
    expect(getDefaultRouteForRole("student")).toBe("/learn");
  });

  it("routes unknown roles to learn", () => {
    expect(getDefaultRouteForRole("")).toBe("/learn");
    expect(getDefaultRouteForRole("guest")).toBe("/learn");
    expect(getDefaultRouteForRole(undefined)).toBe("/learn");
  });
});

describe("resolvePostLoginPath", () => {
  it("uses role default when next is missing", () => {
    expect(resolvePostLoginPath("teacher", "?")).toBe("/teacher/dashboard");
    expect(resolvePostLoginPath("school_admin", "")).toBe("/school/dashboard");
  });

  it("honors safe next path", () => {
    expect(resolvePostLoginPath("teacher", "?next=/teacher/tasks")).toBe("/teacher/tasks");
  });
});

describe("shouldRedirectFromLearn", () => {
  it("flags school_admin and teacher", () => {
    expect(shouldRedirectFromLearn("school_admin")).toBe(true);
    expect(shouldRedirectFromLearn("teacher")).toBe(true);
    expect(shouldRedirectFromLearn("student")).toBe(false);
  });
});
