import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import { buildPublicNavItems } from "../../utils/publicNav";

const getStatusBadge = (status, isActive) => {
  if (!isActive || status === "inactive") {
    return { label: "Inactive", className: "bg-gray-200 text-gray-700" };
  }
  if (status === "expired") {
    return { label: "Expired", className: "bg-amber-100 text-amber-900 ring-1 ring-amber-200" };
  }
  return { label: "Active", className: "bg-green-100 text-green-800 ring-1 ring-green-200" };
};

const getOverallBadge = (student) => {
  const { completed_count: done, total_quizzes: total } = student;
  if (!total) return { label: "No quizzes", className: "bg-gray-100 text-gray-600" };
  if (done === total) return { label: "Completed", className: "bg-green-100 text-green-800 ring-1 ring-green-200" };
  if (done === 0) return { label: "Not started", className: "bg-red-100 text-red-800 ring-1 ring-red-200" };
  return {
    label: `${done}/${total} completed`,
    className: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200",
  };
};

function QuizProgressBadge({ quiz }) {
  if (quiz.completed) {
    const marks =
      quiz.marks_obtained != null && quiz.total_marks != null
        ? `${quiz.marks_obtained}/${quiz.total_marks}`
        : "—";
    const pct = quiz.percentage != null ? `${quiz.percentage}%` : "";
    const letter = quiz.grade ? ` (${quiz.grade})` : "";
    return (
      <span className="inline-flex flex-wrap items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 ring-1 ring-green-200">
        <span>Done</span>
        <span className="text-green-900">
          — {marks}
          {pct ? ` (${pct})` : ""}
          {letter}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200">
      Not Done
    </span>
  );
}

function StudentProgressRow({ student }) {
  const overall = getOverallBadge(student);
  return (
    <tr className="border-b border-gray-100 last:border-b-0 hover:bg-green-50/40">
      <td className="px-3 py-3 text-left font-medium text-gray-900">{student.full_name}</td>
      <td className="px-3 py-3 text-center text-gray-700">{student.grade || "—"}</td>
      <td className="px-3 py-3">
        <div className="flex flex-col gap-1.5">
          {(student.quizzes || []).map((q) => (
            <div key={`${student.id}-${q.quiz_id}`} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-gray-700">{q.quiz_title}:</span>
              <QuizProgressBadge quiz={q} />
            </div>
          ))}
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${overall.className}`}>
          {overall.label}
        </span>
      </td>
    </tr>
  );
}

function StudentProgressCard({ student }) {
  const overall = getOverallBadge(student);
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-bold text-gray-900">{student.full_name}</h4>
          <p className="text-xs text-gray-500">{student.username}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${overall.className}`}>
          {overall.label}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">Grade: {student.grade || "—"}</p>
      <div className="mt-3 space-y-2">
        {(student.quizzes || []).map((q) => (
          <div key={`${student.id}-m-${q.quiz_id}`} className="rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-sm font-medium text-gray-800">{q.quiz_title}</p>
            <div className="mt-1">
              <QuizProgressBadge quiz={q} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function TeacherTasks() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tasks, setTasks] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const fetchTasks = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await axiosInstance.get("teacher/tasks/");
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        "Failed to load teacher tasks.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
    setUserFullName(localStorage.getItem("user_full_name") || "");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_full_name");
    localStorage.removeItem("account_status");
    localStorage.removeItem("role");
    localStorage.removeItem("user_grade");
    navigate("/", { replace: true });
  };

  const navItems = useMemo(() => buildPublicNavItems(role), [role]);

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    setDeletingId(taskId);
    setErr("");
    try {
      await axiosInstance.delete(`teacher/tasks/${taskId}/delete/`);
      setTasks((prev) => prev.filter((t) => (t.task_id || t.id) !== taskId));
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        "Failed to delete task.";
      setErr(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleProgress = (taskId) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const isProgressExpanded = (taskId, studentCount) => {
    if (expandedTasks[taskId] !== undefined) return expandedTasks[taskId];
    return studentCount <= 8;
  };

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Practicing Math Responsibly"
      isAuthenticated={Boolean(role)}
      userFullName={userFullName}
      navItems={navItems}
      isMobileDrawerOpen={mobileDrawerOpen}
      onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
      onLogoutClick={handleLogout}
      mobileAuthContent={
        role ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] text-gray-800">
        <section className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-extrabold text-green-900 sm:text-3xl">My Tasks</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              Track assigned quizzes and student completion for each task.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Link
              to="/teacher/assign-task"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto"
            >
              + Assign New Task
            </Link>
            <button
              type="button"
              onClick={fetchTasks}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto"
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div aria-live="polite" className="rounded-xl border border-gray-200 bg-white p-5 text-gray-700 shadow-sm">
              Loading tasks...
            </div>
          )}

          {!loading && err && (
            <div aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
              {err}
            </div>
          )}

          {!loading && !err && tasks.length === 0 && (
            <div aria-live="polite" className="rounded-xl border border-gray-200 bg-white p-5 text-gray-700 shadow-sm">
              No tasks created yet.
            </div>
          )}

          <div className="space-y-5">
            {!loading &&
              !err &&
              tasks.map((t) => {
                const taskId = t.task_id || t.id;
                const statusBadge = getStatusBadge(t.status, t.is_active);
                const students = Array.isArray(t.assigned_students) ? t.assigned_students : [];
                const quizzes = Array.isArray(t.quizzes) ? t.quizzes : [];
                const progressOpen = isProgressExpanded(taskId, students.length);

                return (
                  <div
                    key={taskId}
                    className="overflow-hidden rounded-3xl border border-green-200 bg-white shadow-md"
                  >
                    <div className="flex flex-col gap-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-800 ring-1 ring-gray-200">
                            Task #{taskId}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                          {t.target_type === "grade_wide" ? (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">
                              Grade-wide: {t.target_grade || "—"}
                            </span>
                          ) : (
                            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-800 ring-1 ring-purple-200">
                              Selected students: {t.target_students_count ?? students.length}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-semibold">Due:</span> {t.due_date || "N/A"}
                          <span className="mx-2">·</span>
                          <span className="font-semibold">Created:</span> {t.created_at || "N/A"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(taskId)}
                        disabled={deletingId === taskId}
                        className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === taskId ? "Deleting…" : "Delete Task"}
                      </button>
                    </div>

                    <div className="space-y-4 px-4 py-5 sm:px-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Instructions</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{t.message}</p>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Quizzes</p>
                        {quizzes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {quizzes.map((q) => (
                              <span
                                key={`${taskId}-quiz-${q.id || q.title}`}
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900"
                              >
                                {q.title || q}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No quizzes attached.</p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50/80">
                        <button
                          type="button"
                          onClick={() => toggleProgress(taskId)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-5"
                        >
                          <span className="text-sm font-bold text-green-900">
                            Student Progress ({students.length})
                          </span>
                          <span className="text-xs font-semibold text-green-700">
                            {progressOpen ? "Hide" : "View"}
                          </span>
                        </button>

                        {progressOpen && (
                          <div className="border-t border-gray-200 px-3 pb-4 pt-3 sm:px-5">
                            {students.length === 0 ? (
                              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                No students currently match this task assignment.
                              </p>
                            ) : (
                              <>
                                <div className="hidden overflow-x-auto md:block">
                                  <table className="min-w-full text-sm">
                                    <thead>
                                      <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                        <th className="px-3 py-2">Student Name</th>
                                        <th className="px-3 py-2 text-center">Grade</th>
                                        <th className="px-3 py-2">Quiz Status</th>
                                        <th className="px-3 py-2 text-center">Overall</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {students.map((student) => (
                                        <StudentProgressRow key={student.id} student={student} />
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="space-y-3 md:hidden">
                                  {students.map((student) => (
                                    <StudentProgressCard key={student.id} student={student} />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
