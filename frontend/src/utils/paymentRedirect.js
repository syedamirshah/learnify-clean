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

export function buildPaymentChooseUrl(apiBase, username) {
  const base = `${(apiBase || "").replace(/\/?$/, "/")}payments/choose/`;
  if (username) {
    return `${base}?username=${encodeURIComponent(username)}`;
  }
  return base;
}
