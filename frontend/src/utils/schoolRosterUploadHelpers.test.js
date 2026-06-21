import { describe, expect, it } from "vitest";
import {
  ROSTER_SEND_WELCOME_EMAILS_FIELD,
  buildRosterUploadFormData,
  formatRosterEmailSummary,
  shouldShowRosterEmailResults,
} from "./schoolRosterUploadHelpers";

describe("schoolRosterUploadHelpers", () => {
  it("does not include send_welcome_emails when checkbox is unchecked", () => {
    const file = new File(["x"], "roster.xlsx");
    const formData = buildRosterUploadFormData(file, { sendWelcomeEmails: false });
    expect(formData.get("file")).toBe(file);
    expect(formData.get(ROSTER_SEND_WELCOME_EMAILS_FIELD)).toBeNull();
  });

  it("submits send_welcome_emails when checkbox is checked", () => {
    const file = new File(["x"], "roster.xlsx");
    const formData = buildRosterUploadFormData(file, { sendWelcomeEmails: true });
    expect(formData.get(ROSTER_SEND_WELCOME_EMAILS_FIELD)).toBe("true");
  });

  it("shows email results only when option was checked and counts are present", () => {
    const result = { emails_sent: 2, emails_skipped: 1 };
    expect(shouldShowRosterEmailResults(result, false)).toBe(false);
    expect(shouldShowRosterEmailResults(result, true)).toBe(true);
    expect(shouldShowRosterEmailResults(null, true)).toBe(false);
  });

  it("formats email summary counts", () => {
    expect(formatRosterEmailSummary({ emails_sent: 3, emails_skipped: 1 })).toEqual({
      emailsSent: 3,
      emailsSkipped: 1,
    });
    expect(formatRosterEmailSummary({})).toEqual({
      emailsSent: 0,
      emailsSkipped: 0,
    });
  });
});
