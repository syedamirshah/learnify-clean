import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";

const StudentSubjectPerformance = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const formatPercent = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? `${num}%` : "—";
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    axiosInstance
      .get("student/subject-performance/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setRows(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load subject performance.");
        setLoading(false);
      });
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

  const navItems = [
    { key: "home", label: "Home", href: "/" },
    { key: "why-join", label: "Why Join Learnify?", href: "/why-join" },
    ...(role === "student"
      ? [
          {
            key: "assessment",
            label: "Assessment",
            href: "/student/assessment",
            children: [
              { key: "subject-wise", label: "Subject-wise Performance", href: "/student/assessment" },
              { key: "quiz-history", label: "Quiz History", href: "/student/quiz-history" },
              { key: "tasks", label: "Tasks", href: "/student/tasks" },
            ],
          },
        ]
      : []),
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
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] px-4 py-8 text-gray-800 md:px-6">
        <header className="mx-auto mb-6 max-w-[1100px]">
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold leading-tight text-green-900 md:text-3xl">
              Subject-wise Performance
            </h2>
            <div className="text-sm font-semibold italic text-green-800 md:text-base">
              Your average vs class average (as provided by backend)
            </div>
          </div>
        </header>

        {/* Main Card */}
        <div className="mx-auto max-w-[1100px]">
          <div className="overflow-hidden rounded-2xl border-2 border-green-200 bg-white shadow-sm">
            {/* Card Header */}
            <div className="border-b border-green-200 bg-green-50 px-5 py-4">
              <div className="text-xl font-black text-green-900 drop-shadow-[0_0.6px_0_rgba(0,0,0,0.15)]">
                Performance Table
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {loading ? (
                <div aria-live="polite" className="py-10 text-center font-semibold text-green-800">
                  Loading...
                </div>
              ) : error ? (
                <div aria-live="polite" className="py-10 text-center">
                  <div className="inline-block rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
                    {error}
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {(rows || []).map((row, idx) => {
                      const isOverall = row.subject === "Overall Performance";
                      return (
                        <article
                          key={`card-${idx}`}
                          className={`rounded-xl border p-4 shadow-sm ${
                            isOverall
                              ? "border-green-300 bg-green-50"
                              : "border-green-200 bg-white"
                          }`}
                        >
                          <h3 className={`text-base ${isOverall ? "font-extrabold text-green-900" : "font-bold text-gray-900"}`}>
                            {row.subject || "—"}
                          </h3>
                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Student Avg</span>
                              <span className="font-semibold text-gray-900">{formatPercent(row.student_avg)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Class Avg</span>
                              <span className="font-semibold text-gray-900">{formatPercent(row.class_avg)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Percentile</span>
                              <span className="font-semibold text-gray-900">{formatPercent(row.percentile)}</span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block md:max-h-[60vh]">
                    <table className="min-w-full text-sm md:text-base">
                      <caption className="sr-only">
                        Subject-wise performance table showing student average, class average, and percentile.
                      </caption>
                      <thead className="sticky top-0 z-10 bg-green-100 text-green-900 font-bold">
                        <tr>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-left">
                            Subject
                          </th>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-center">
                            Student Avg (%)
                          </th>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-center">
                            Class Avg (%)
                          </th>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-center">
                            Percentile
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {(rows || []).map((row, idx) => {
                          const isOverall = row.subject === "Overall Performance";
                          return (
                            <tr
                              key={idx}
                              className={`transition ${
                                isOverall
                                  ? "bg-green-50 font-extrabold"
                                  : idx % 2 === 0
                                  ? "bg-white"
                                  : "bg-green-50/40"
                              } hover:bg-green-50`}
                            >
                              <td className="px-4 py-3 border-b border-green-100 text-left">
                                {row.subject || "—"}
                              </td>
                              <td className="px-4 py-3 border-b border-green-100 text-center">
                                <span
                                  className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full border ${
                                    isOverall
                                      ? "border-green-300 bg-white/80"
                                      : "border-green-200 bg-white/70"
                                  } font-bold text-gray-900`}
                                >
                                  {formatPercent(row.student_avg)}
                                </span>
                              </td>
                              <td className="px-4 py-3 border-b border-green-100 text-center">
                                <span
                                  className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full border ${
                                    isOverall
                                      ? "border-green-300 bg-white/80"
                                      : "border-green-200 bg-white/70"
                                  } font-bold text-gray-900`}
                                >
                                  {formatPercent(row.class_avg)}
                                </span>
                              </td>
                              <td className="px-4 py-3 border-b border-green-100 text-center">
                                <span
                                  className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full border ${
                                    isOverall
                                      ? "border-green-300 bg-white/80"
                                      : "border-green-200 bg-white/70"
                                  } font-bold text-gray-900`}
                                >
                                  {formatPercent(row.percentile)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {!loading && !error && (rows || []).length === 0 && (
                <div className="py-8 text-center text-gray-600">
                  No subject performance data available.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-green-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Tip: Improve your weak subjects by attempting more quizzes.
                </div>
                <Link
                  to="/student/quiz-history"
                  className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white/70 px-4 py-2 font-bold text-green-900 shadow-sm transition hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  View Quiz History →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentSubjectPerformance;
