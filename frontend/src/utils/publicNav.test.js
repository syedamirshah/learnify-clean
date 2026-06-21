import { describe, expect, it } from "vitest";
import { buildPublicNavItems } from "./publicNav";

function findNavItem(items, key) {
  return items.find((item) => item.key === key);
}

describe("buildPublicNavItems", () => {
  it("routes student home to learn without a separate quizzes link", () => {
    const items = buildPublicNavItems("student");
    expect(findNavItem(items, "home")?.href).toBe("/learn");
    expect(findNavItem(items, "quizzes")).toBeUndefined();
  });

  it("includes teacher home dashboard and quizzes link to learn", () => {
    const items = buildPublicNavItems("teacher");
    expect(findNavItem(items, "home")?.href).toBe("/teacher/dashboard");
    expect(findNavItem(items, "quizzes")?.label).toBe("Quizzes");
    expect(findNavItem(items, "quizzes")?.href).toBe("/learn");
    expect(findNavItem(items, "my-students")).toBeUndefined();
  });

  it("includes school_admin home dashboard and quizzes link to learn", () => {
    const items = buildPublicNavItems("school_admin");
    expect(findNavItem(items, "home")?.href).toBe("/school/dashboard");
    expect(findNavItem(items, "quizzes")?.label).toBe("Quizzes");
    expect(findNavItem(items, "quizzes")?.href).toBe("/learn");
    expect(findNavItem(items, "users")).toBeUndefined();
  });
});
