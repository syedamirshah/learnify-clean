/** Redirect unpaid/expired students and teachers to Easypay choose page. */
export function needsPaymentRedirect(accountStatus) {
  return accountStatus === "expired" || accountStatus === "inactive";
}

export function paymentRedirectMessage(accountStatus) {
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
      localStorage.getItem("user") || // legacy fallback (if ever used)
      ""
    ).trim();
  } catch {
    return "";
  }
}

export function buildPaymentChooseUrl(apiBase, username) {
  const base = `${(apiBase || "").replace(/\/?$/, "/")}payments/choose/`;
  const resolved = (username || readStoredUsername()).trim();
  if (resolved) {
    return `${base}?username=${encodeURIComponent(resolved)}`;
  }
  return base;
}
