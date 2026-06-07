import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import { buildPublicNavItems } from "../../utils/publicNav";

const formatScore = (value) => (value === null || value === undefined ? "—" : `${value}%`);

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-green-200 bg-white p-4 shadow-sm ring-1 ring-green-100">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-green-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("teacher/dashboard-summary/");
        setData(res.data || null);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load teacher dashboard."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
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

  const summary = data?.summary || {};
  const teacher = data?.teacher || {};
  const attention = data?.students_requiring_attention || [];
  const recent = data?.recent_activity || [];
  const grades = data?.grade_snapshot || [];

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
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] text-gray-800">
        <section className="border-b border-green-200 bg-gradient-to-r from-green-50 via-white to-emerald-50 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-black text-green-900 sm:text-3xl">
              Welcome, {teacher.full_name || userFullName || "Teacher"}
            </h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              Here is today&apos;s overview for your students.
            </p>
            {(teacher.school_name || teacher.city) && (
              <p className="mt-2 text-xs font-semibold text-emerald-800">
                {[teacher.school_name, teacher.city].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </section>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-green-700 shadow-sm">
              Loading dashboard...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard label="My Students" value={summary.students_count ?? 0} />
                <MetricCard label="Active Tasks" value={summary.active_tasks_count ?? 0} />
                <MetricCard
                  label="Pending Work"
                  value={summary.pending_task_items_count ?? 0}
                  hint={`${summary.completed_task_items_count ?? 0} items completed`}
                />
                <MetricCard
                  label="Average Score"
                  value={formatScore(summary.average_student_score)}
                />
              </section>

              {summary.students_count === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                  No students found for your school and city yet.
                </div>
              )}

              <section className="rounded-3xl border border-green-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-green-900">Students Requiring Attention</h2>
                {attention.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-600">No students need attention right now.</p>
                ) : (
                  <>
                    <div className="mt-4 hidden overflow-x-auto md:block">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                            <th className="px-3 py-2">Student</th>
                            <th className="px-3 py-2">Grade</th>
                            <th className="px-3 py-2">Reason</th>
                            <th className="px-3 py-2">Detail</th>
                            <th className="px-3 py-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attention.map((row) => (
                            <tr key={row.student_id} className="border-t border-gray-100 hover:bg-green-50/50">
                              <td className="px-3 py-3 font-medium text-gray-900">{row.full_name}</td>
                              <td className="px-3 py-3 text-gray-700">{row.grade || "—"}</td>
                              <td className="px-3 py-3 text-gray-700">{row.reason}</td>
                              <td className="px-3 py-3 text-gray-600">{row.detail}</td>
                              <td className="px-3 py-3 text-center">
                                <Link
                                  to={row.quiz_history_path}
                                  className="inline-flex rounded-xl bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                                >
                                  View Quiz History
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 space-y-3 md:hidden">
                      {attention.map((row) => (
                        <article
                          key={`m-${row.student_id}`}
                          className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <h3 className="font-bold text-gray-900">{row.full_name}</h3>
                          <p className="text-xs text-gray-500">{row.grade || "—"}</p>
                          <p className="mt-2 text-sm font-semibold text-amber-900">{row.reason}</p>
                          <p className="text-sm text-gray-600">{row.detail}</p>
                          <Link
                            to={row.quiz_history_path}
                            className="mt-3 inline-flex rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            View Quiz History
                          </Link>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <section className="rounded-3xl border border-green-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-green-900">Recent Activity</h2>
                {recent.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-600">No quiz activity yet.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {recent.map((item, idx) => (
                      <li
                        key={`${item.student_name}-${item.quiz_title}-${idx}`}
                        className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm"
                      >
                        <span className="font-semibold text-gray-900">{item.student_name}</span>{" "}
                        completed <span className="font-medium text-emerald-900">{item.quiz_title}</span>
                        {" — "}
                        <span className="font-bold text-green-800">{item.percentage}%</span>
                        {item.completed_at ? (
                          <span className="text-gray-500"> · {item.completed_at}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-3xl border border-green-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-green-900">Grade Snapshot</h2>
                {grades.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-600">No grade data available yet.</p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {grades.map((g) => (
                      <div
                        key={g.grade}
                        className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-green-50 p-4"
                      >
                        <p className="text-sm font-black text-green-900">{g.grade}</p>
                        <div className="mt-2 space-y-1 text-sm text-gray-700">
                          <p>
                            <span className="font-semibold">Students:</span> {g.students_count}
                          </p>
                          <p>
                            <span className="font-semibold">Avg Score:</span>{" "}
                            {formatScore(g.average_score)}
                          </p>
                          <p>
                            <span className="font-semibold">Pending Work:</span>{" "}
                            {g.pending_tasks_count ?? 0}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-green-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-green-900">Quick Actions</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "My Students", href: "/teacher/assessment" },
                    { label: "Assign Task", href: "/teacher/assign-task" },
                    { label: "My Tasks", href: "/teacher/tasks" },
                    { label: "Honor Board", href: "/honor-board" },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      to={action.href}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
                {summary.active_tasks_count === 0 && (
                  <p className="mt-3 text-sm text-gray-600">No active tasks assigned yet.</p>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
