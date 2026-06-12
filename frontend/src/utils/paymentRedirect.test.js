import { describe, expect, it } from "vitest";
import { buildSchoolPaymentChooseUrl } from "./paymentRedirect";

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

  it("uses default API base when apiBase is omitted", () => {
    const url = buildSchoolPaymentChooseUrl(undefined, 7, "principal1");
    expect(url).toMatch(
      /^https:\/\/api\.learnifypakistan\.com\/api\/payments\/school\/choose\/\?/
    );
    expect(url).toContain("school_id=7");
    expect(url).toContain("username=principal1");
  });
});
