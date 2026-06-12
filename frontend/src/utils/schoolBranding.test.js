import { describe, expect, it, vi } from "vitest";
import {
  fetchSchoolLogoUrl,
  invalidateSchoolLogoCache,
  resolveSchoolLogoSrc,
  setSchoolLogoUrl,
  subscribeSchoolLogo,
} from "./schoolBranding";

describe("resolveSchoolLogoSrc", () => {
  it("returns school logo url when provided", () => {
    expect(resolveSchoolLogoSrc("https://cdn.example/school.png", "/fallback.png")).toBe(
      "https://cdn.example/school.png"
    );
  });

  it("falls back to Learnify logo when url missing", () => {
    expect(resolveSchoolLogoSrc(null, "/fallback.png")).toBe("/fallback.png");
    expect(resolveSchoolLogoSrc("", "/fallback.png")).toBe("/fallback.png");
  });
});

describe("school logo cache", () => {
  it("notifies subscribers when logo url is set", () => {
    invalidateSchoolLogoCache();
    const listener = vi.fn();
    const unsubscribe = subscribeSchoolLogo(listener);

    setSchoolLogoUrl("https://cdn.example/new.png");

    expect(listener).toHaveBeenCalledWith("https://cdn.example/new.png");

    unsubscribe();
  });

  it("returns cached logo url without refetching", async () => {
    invalidateSchoolLogoCache();
    setSchoolLogoUrl("https://cdn.example/cached.png");
    await expect(fetchSchoolLogoUrl()).resolves.toBe("https://cdn.example/cached.png");
  });
});
