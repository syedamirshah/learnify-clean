/**
 * Default home route after login by role.
 * admin/manager use backend login; frontend falls back to /learn.
 */
export function getDefaultRouteForRole(role) {
  const normalized = String(role || "").trim().toLowerCase();

  if (normalized === "school_admin") return "/school/dashboard";
  if (normalized === "teacher") return "/teacher/dashboard";
  if (normalized === "student") return "/learn";

  return "/learn";
}

/** Safe internal path from ?next= query value. */
export function parseSafeNextPath(next) {
  if (!next || typeof next !== "string") return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  return next;
}

/**
 * Post-login destination: honor ?next= when safe, otherwise role default.
 * @param {string} role
 * @param {string|undefined} search - location.search or raw next path
 */
export function resolvePostLoginPath(role, search) {
  let next = null;

  if (typeof search === "string" && search.length > 0) {
    if (search.startsWith("?") || search.includes("=")) {
      const query = search.startsWith("?") ? search.slice(1) : search;
      next = parseSafeNextPath(new URLSearchParams(query).get("next"));
    } else {
      next = parseSafeNextPath(search);
    }
  }

  return next || getDefaultRouteForRole(role);
}

/** Non-students should not stay on the student learning hub (/learn). */
export function shouldRedirectFromLearn(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return normalized === "school_admin" || normalized === "teacher";
}
