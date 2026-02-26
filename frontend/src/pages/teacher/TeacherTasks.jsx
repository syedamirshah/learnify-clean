import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";

export default function TeacherTasks() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tasks, setTasks] = useState([]);
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

  const computed = useMemo(() => {
    return tasks.map((t) => ({
      ...t,
      _quizCount: Array.isArray(t.quizzes) ? t.quizzes.length : 0,
    }));
  }, [tasks]);

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

  const navItems = [
    { key: "home", label: "Home", href: "/" },
    { key: "why-join", label: "Why Join Learnify?", href: "/why-join" },
    ...(role === "teacher"
      ? [
          {
            key: "assessment",
            label: "Assessment",
            href: "/teacher/assessment",
            children: [
              { key: "student-results", label: "Student Results", href: "/teacher/assessment" },
              { key: "teacher-tasks", label: "My Tasks", href: "/teacher/tasks" },
              { key: "assign-task", label: "Assign Task", href: "/teacher/assign-task" },
            ],
          },
        ]
      : []),
    { key: "honor-board", label: "Honor Board", href: "/honor-board" },
    { key: "membership", label: "Membership", href: "/membership" },
    { key: "help-center", label: "Help Center", href: "/help-center" },
  ];

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Learning with Responsibility"
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
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Tasks you created for students.</p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Link
              to="/"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto"
            >
              Back to Home
            </Link>

            <Link
              to="/teacher/assign-task"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto"
            >
              + Assign New Task
            </Link>

            <button
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

          {!loading && !err && computed.length === 0 && (
            <div aria-live="polite" className="rounded-xl border border-gray-200 bg-white p-5 text-gray-700 shadow-sm">
              No tasks created yet.
            </div>
          )}

          <div className="space-y-4">
            {!loading &&
              !err &&
              computed.map((t) => (
                <div key={t.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="p-4 sm:p-5 md:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        Task #{t.id}
                      </span>

                      {t.is_active ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                          Inactive
                        </span>
                      )}

                      {t.target_grade ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                          Grade-wide: {t.target_grade}
                        </span>
                      ) : (
                        <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">
                          Student-specific: {t.target_students_count}
                        </span>
                      )}

                      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
                        Quizzes: {t._quizCount}
                      </span>
                    </div>

                    <div className="mt-3 text-base font-semibold text-gray-900 sm:text-lg">{t.message}</div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <div>
                        <span className="font-medium">Due:</span>{" "}
                        {t.due_date ? String(t.due_date) : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{" "}
                        {t.created_at ? String(t.created_at) : "N/A"}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 text-sm font-semibold text-gray-700">Quizzes</div>

                      {Array.isArray(t.quizzes) && t.quizzes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {t.quizzes.map((qt, idx) => (
                            <span
                              key={`${t.id}-q-${idx}`}
                              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                            >
                              {qt}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No quizzes attached.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
