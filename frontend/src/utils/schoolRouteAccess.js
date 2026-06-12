/**
 * Pure access check for school admin routes (testable without React).
 * Returns: "allow" | "login" | "denied"
 */
export function resolveSchoolRouteAccess({ accessToken, role }) {
  const token = (accessToken || "").trim();
  const normalizedRole = (role || "").trim();

  if (!token || !normalizedRole) {
    return "login";
  }
  if (normalizedRole !== "school_admin") {
    return "denied";
  }
  return "allow";
}
