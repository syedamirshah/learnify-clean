import { describe, expect, it } from "vitest";
import {
  buildSchoolPaymentChooseUrl,
  isSchoolSubscriptionActive,
  needsPaymentRedirect,
  paymentRedirectMessage,
  resolvePaymentRedirectUrl,
} from "./paymentRedirect";

describe("buildSchoolPaymentChooseUrl", () => {
  it("points to backend payments/school/choose with school_id and username", () => {
    const url = buildSchoolPaymentChooseUrl(
      "https://api.learnifypakistan.com/api/",
      42,
      "cityschool_admin"
    );
    expect(url).toBe(
      "https://api.learnifypakistan.com/api/payments/school/choose/?school_id=42&username=cityschool_admin"
    );
  });
});

describe("school subscription redirect helpers", () => {
  it("allows school-linked users when school license is active", () => {
    expect(
      needsPaymentRedirect("inactive", "student", {
        schoolId: 7,
        schoolAccountStatus: "active",
        schoolSubscriptionExpiry: "2099-12-31",
      })
    ).toBe(false);
  });

  it("blocks school-linked users when school license is inactive", () => {
    expect(
      needsPaymentRedirect("active", "teacher", {
        schoolId: 7,
        schoolAccountStatus: "pending_payment",
        schoolSubscriptionExpiry: null,
      })
    ).toBe(true);
  });

  it("keeps retail student redirect based on account status", () => {
    expect(needsPaymentRedirect("inactive", "student", { schoolId: null })).toBe(true);
    expect(
      needsPaymentRedirect("active", "student", {
        schoolId: null,
        schoolAccountStatus: null,
        schoolSubscriptionExpiry: "2099-12-31",
      })
    ).toBe(false);
  });

  it("routes school admin to school payment and school users away from retail", () => {
    expect(
      resolvePaymentRedirectUrl("https://api.learnifypakistan.com/api/", {
        role: "school_admin",
        schoolId: 9,
        username: "principal1",
      })
    ).toContain("/payments/school/choose/");

    expect(
      resolvePaymentRedirectUrl("https://api.learnifypakistan.com/api/", {
        role: "student",
        schoolId: 9,
        username: "school_student",
      })
    ).toBe("/help-center?school_subscription=inactive");
  });

  it("uses school-specific payment messages for school-linked users", () => {
    expect(
      paymentRedirectMessage("active", "teacher", {
        schoolId: 3,
        schoolAccountStatus: "expired",
      })
    ).toContain("school");
  });

  it("evaluates school subscription active helper", () => {
    expect(isSchoolSubscriptionActive("active", "2099-12-31")).toBe(true);
    expect(isSchoolSubscriptionActive("expired", "2099-12-31")).toBe(false);
    expect(isSchoolSubscriptionActive("active", "2000-01-01")).toBe(false);
  });
});
