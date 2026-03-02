export function getAuthSnapshot() {
  const storedRole = localStorage.getItem("user_role") || localStorage.getItem("role") || "";
  const userFullName = localStorage.getItem("user_full_name") || "";
  const gradeId = localStorage.getItem("user_grade_id") || localStorage.getItem("grade_id") || "";
  const accessToken = localStorage.getItem("access_token") || "";
  const role = accessToken ? storedRole : "";

  return {
    role,
    userFullName,
    gradeId: /^\d+$/.test(String(gradeId)) ? String(gradeId) : "",
    accessToken,
    isStudent: role === "student",
    isTeacher: role === "teacher",
    isAuthed: Boolean(role),
  };
}

export function persistStudentGrade(profileData = {}) {
  const candidates = [
    profileData?.grade_id,
    profileData?.user?.grade_id,
    profileData?.grade?.id,
    profileData?.user?.grade?.id,
    profileData?.grade,
    profileData?.user?.grade,
  ];
  const numericGrade = candidates.find((value) => /^\d+$/.test(String(value ?? "")));
  const gradeId = numericGrade !== undefined ? String(numericGrade) : "";

  const gradeName =
    profileData?.grade_name ??
    profileData?.grade?.name ??
    profileData?.grade ??
    profileData?.user?.grade?.name ??
    "";

  if (/^\d+$/.test(gradeId)) {
    localStorage.setItem("user_grade_id", gradeId);
    localStorage.setItem("grade_id", gradeId);
  }

  if (gradeName) {
    localStorage.setItem("user_grade", String(gradeName));
  }

  return /^\d+$/.test(gradeId) ? gradeId : "";
}

export async function hydrateStudentGradeIdFromProfile(apiBase) {
  const role = localStorage.getItem("user_role") || localStorage.getItem("role") || "";
  const accessToken = localStorage.getItem("access_token") || "";
  const existing = localStorage.getItem("user_grade_id") || localStorage.getItem("grade_id") || "";

  if (role !== "student") return { ok: false, reason: "not-student" };
  if (/^\d+$/.test(String(existing))) return { ok: true, gradeId: String(existing) };
  if (!accessToken) return { ok: false, reason: "401" };

  try {
    const res = await fetch(`${apiBase}user/me/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (res.status === 401) return { ok: false, reason: "401" };
    if (!res.ok) return { ok: false, reason: `status_${res.status}` };

    const data = await res.json();
    const gradeId = persistStudentGrade(data);
    if (gradeId) return { ok: true, gradeId };
    return { ok: false, reason: "no-grade" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_full_name");
  localStorage.removeItem("account_status");
  localStorage.removeItem("role");
  localStorage.removeItem("user_grade");
  localStorage.removeItem("user_grade_id");
  localStorage.removeItem("grade_id");
}
