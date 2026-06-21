import { API_BASE_URL } from "./apiConfig";

function parseDateOnly(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function isSchoolSubscriptionActive(schoolAccountStatus, schoolSubscriptionExpiry) {
  if (schoolAccountStatus !== "active") return false;
  const expiry = parseDateOnly(schoolSubscriptionExpiry);
  if (!expiry) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry >= today;
}

export function isSchoolLinkedRole(role, schoolId) {
  const normalizedRole = (role || "").trim();
  const hasSchool = Boolean(schoolId);
  return hasSchool && (normalizedRole === "student" || normalizedRole === "teacher");
}

/** Redirect unpaid/expired users to the correct payment or renewal flow. */
export function needsPaymentRedirect(accountStatus, role, options = {}) {
  if (role === "school_admin") {
    return false;
  }

  const schoolId = options.schoolId ?? options.school_id ?? null;
  if (isSchoolLinkedRole(role, schoolId)) {
    return !isSchoolSubscriptionActive(
      options.schoolAccountStatus ?? options.school_account_status,
      options.schoolSubscriptionExpiry ?? options.school_subscription_expiry,
    );
  }

  return accountStatus === "expired" || accountStatus === "inactive";
}

export function paymentRedirectMessage(accountStatus, role, options = {}) {
  const schoolId = options.schoolId ?? options.school_id ?? null;
  if (isSchoolLinkedRole(role, schoolId)) {
    const schoolStatus = options.schoolAccountStatus ?? options.school_account_status;
    if (schoolStatus === "suspended") {
      return "Your school account has been suspended. Please contact your school administrator or Learnify support.";
    }
    if (schoolStatus === "expired") {
      return "Your school's Learnify subscription has expired. Please ask your school administrator to renew the school license.";
    }
    return "Your school's Learnify subscription is not active yet. Please ask your school administrator to complete payment.";
  }

  if (accountStatus === "inactive") {
    return "Your account is not activated yet. Please complete payment to activate your subscription.";
  }
  if (accountStatus === "expired") {
    return "Your subscription has expired. Please renew your subscription.";
  }
  return "";
}

function readStoredUsername() {
  try {
    return (
      localStorage.getItem("username") ||
      localStorage.getItem("user_username") ||
      localStorage.getItem("user") ||
      ""
    ).trim();
  } catch {
    return "";
  }
}

export function getApiBaseUrl(apiBase) {
  return `${(apiBase || API_BASE_URL).replace(/\/?$/, "/")}`;
}

export function buildPaymentChooseUrl(apiBase, username) {
  const base = `${getApiBaseUrl(apiBase)}payments/choose/`;
  const resolved = (username || readStoredUsername()).trim();
  if (resolved) {
    return `${base}?username=${encodeURIComponent(resolved)}`;
  }
  return base;
}

export function buildSchoolPaymentChooseUrl(apiBase, schoolId, username) {
  const base = `${getApiBaseUrl(apiBase)}payments/school/choose/`;
  const params = new URLSearchParams({
    school_id: String(schoolId),
    username: (username || readStoredUsername()).trim(),
  });
  return `${base}?${params.toString()}`;
}

export function resolvePaymentRedirectUrl(apiBase, options = {}) {
  const role = options.role || "";
  const username = options.username || readStoredUsername();
  const schoolId = options.schoolId ?? options.school_id ?? null;

  if (role === "school_admin" && schoolId) {
    return buildSchoolPaymentChooseUrl(apiBase, schoolId, username);
  }

  if (isSchoolLinkedRole(role, schoolId)) {
    return "/help-center?school_subscription=inactive";
  }

  return buildPaymentChooseUrl(apiBase, username);
}

export function buildPaymentRedirectContext(profileData = {}) {
  const schoolId = profileData.school_id ?? null;
  const schoolAccountStatus = profileData.school_account_status ?? null;
  const schoolSubscriptionExpiry = profileData.school_subscription_expiry ?? null;

  return {
    schoolId,
    schoolAccountStatus,
    schoolSubscriptionExpiry,
  };
}
