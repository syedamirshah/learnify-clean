export const ROSTER_SEND_WELCOME_EMAILS_FIELD = "send_welcome_emails";

export function buildRosterUploadFormData(file, { sendWelcomeEmails = false } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (sendWelcomeEmails) {
    formData.append(ROSTER_SEND_WELCOME_EMAILS_FIELD, "true");
  }
  return formData;
}

export function shouldShowRosterEmailResults(result, sendWelcomeEmails) {
  if (!sendWelcomeEmails || !result) {
    return false;
  }
  return result.emails_sent != null || result.emails_skipped != null;
}

export function formatRosterEmailSummary(result) {
  return {
    emailsSent: result?.emails_sent ?? 0,
    emailsSkipped: result?.emails_skipped ?? 0,
  };
}
