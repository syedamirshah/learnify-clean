import { describe, expect, it } from "vitest";
import {
  extractTopStudent,
  getActiveTasksSummary,
  getAttentionSummary,
  getOnboardingPercent,
  getOnboardingSteps,
  shouldShowOnboardingProgress,
} from "./schoolDashboardHelpers";

describe("getOnboardingSteps and getOnboardingPercent", () => {
  it("builds four onboarding steps", () => {
    const steps = getOnboardingSteps({
      onboarding: {
        subscription_active: true,
        roster_uploaded: false,
        ready: false,
      },
      counts: { teachers: 0 },
      school: { account_status: "active" },
    });

    expect(steps).toHaveLength(4);
    expect(steps.map((step) => step.label)).toEqual([
      "School Activated",
      "Subscription Active",
      "Roster Uploaded",
      "Teachers Added",
    ]);
  });

  it("calculates onboarding percentage", () => {
    const steps = getOnboardingSteps({
      onboarding: { subscription_active: true, roster_uploaded: true },
      counts: { teachers: 2 },
      school: { account_status: "active" },
    });

    expect(getOnboardingPercent(steps)).toBe(100);
  });

  it("hides onboarding when ready", () => {
    expect(shouldShowOnboardingProgress({ ready: true })).toBe(false);
    expect(shouldShowOnboardingProgress({ ready: false })).toBe(true);
  });
});

describe("extractTopStudent", () => {
  it("returns top student when available", () => {
    const result = extractTopStudent([
      { id: 1, full_name: "Ayesha Khan", username: "ayesha", average_score: 92 },
    ]);

    expect(result.student.username).toBe("ayesha");
    expect(result.displayName).toBe("Ayesha Khan");
    expect(result.scoreLabel).toBe("92%");
  });

  it("handles empty top students", () => {
    const result = extractTopStudent([]);
    expect(result.student).toBeNull();
    expect(result.displayName).toBe("No ranked students yet");
    expect(result.scoreLabel).toBe("—");
  });
});

describe("getAttentionSummary", () => {
  it("returns attention count", () => {
    const result = getAttentionSummary([
      { full_name: "Low Student", username: "low1", average_score: 30 },
      { full_name: "Another", username: "low2", average_score: 20 },
    ]);

    expect(result.count).toBe(2);
    expect(result.displayValue).toBe("2");
    expect(result.hint).toContain("Low Student");
  });

  it("handles empty attention list", () => {
    const result = getAttentionSummary([]);
    expect(result.count).toBe(0);
    expect(result.hint).toBe("No students need attention");
  });
});

describe("getActiveTasksSummary", () => {
  it("returns active task count", () => {
    const result = getActiveTasksSummary({ summary: { active_tasks: 3 } });
    expect(result.count).toBe(3);
    expect(result.displayValue).toBe("3");
  });

  it("handles missing task monitoring payload", () => {
    const result = getActiveTasksSummary(null);
    expect(result.count).toBe(0);
    expect(result.hint).toBe("No active tasks");
  });
});
