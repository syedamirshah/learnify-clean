export function getAuthSnapshot() {
  const role = localStorage.getItem("user_role") || localStorage.getItem("role") || "";
  const userFullName = localStorage.getItem("user_full_name") || "";
  const gradeId = localStorage.getItem("user_grade_id") || localStorage.getItem("grade_id") || "";
  const accessToken = localStorage.getItem("access_token") || "";

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
