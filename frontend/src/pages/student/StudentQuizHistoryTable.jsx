import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";

const StudentQuizHistoryTable = () => {
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        const res = await axiosInstance.get("student/quiz-history/");
        setQuizResults(res.data.results || []);
        setStudentName(res.data.full_name || "");
      } catch (err) {
        console.error("Failed to fetch student quiz history:", err);
        setError("Failed to load quiz history.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizHistory();
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

  // ✅ keep your existing total calc (same logic) but centralize it for UI
  const rows = useMemo(() => {
    return (quizResults || []).map((r) => {
      const totalMarks = (r.total_questions || 0) * (r.marks_per_question || 0);
      return { ...r, totalMarks };
    });
  }, [quizResults]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
      const quizTitle = String(row.quiz_title || "").toLowerCase();
      const subject = String(row.subject || "").toLowerCase();
      const chapter = String(row.chapter || "").toLowerCase();
      return quizTitle.includes(query) || subject.includes(query) || chapter.includes(query);
    });
  }, [rows, searchTerm]);

  const visibleMobileRows = useMemo(
    () => filteredRows.slice(0, visibleCount),
    [filteredRows, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm]);

  const formatFriendlyDate = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
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
        <header className="mx-auto mb-6 max-w-[1200px]">
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold leading-tight text-green-900 md:text-3xl">
              Your Quiz History
            </h2>
            <div className="truncate text-sm font-semibold italic text-green-800 md:text-base">
              {studentName ? `Student: ${studentName}` : " "}
            </div>
          </div>
        </header>

        {/* Main Card (Landing style) */}
        <div className="mx-auto max-w-[1200px] min-w-0">
          <div className="overflow-hidden rounded-2xl border-2 border-green-200 bg-white shadow-sm">
            {/* Card Header */}
            <div className="border-b border-green-200 bg-green-50 px-4 py-3 sm:px-5 sm:py-4">
              <div className="text-xl font-black text-green-900 drop-shadow-[0_0.6px_0_rgba(0,0,0,0.15)]">
                Completed Quizzes
              </div>
              <div className="mt-1 text-sm text-gray-700">
                Latest attempt is shown per quiz (as your backend returns).
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-4">
                <label htmlFor="quiz-history-search" className="sr-only">
                  Search quiz history by quiz title, subject, or chapter
                </label>
                <input
                  id="quiz-history-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by quiz, subject, or chapter"
                  className="w-full rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 md:text-base"
                />
              </div>

              {loading ? (
                <div aria-live="polite" className="py-10 text-center font-semibold text-green-800">
                  Loading quiz history...
                </div>
              ) : error ? (
                <div aria-live="polite" className="py-10 text-center">
                  <div className="inline-block rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
                    {error}
                  </div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div aria-live="polite" className="py-10 text-center">
                  <div className="mx-auto max-w-md rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-gray-700">
                    <div className="font-semibold text-green-900">
                      {rows.length === 0
                        ? "No quiz history available yet."
                        : "No quiz history matches your search."}
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <Link
                        to="/"
                        className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-semibold text-green-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                      >
                        Go to Quizzes
                      </Link>
                      <Link
                        to="/student/assessment"
                        className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-semibold text-green-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                      >
                        View Assessment
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {visibleMobileRows.map((result, idx) => (
                      <article
                        key={`card-${idx}`}
                        className={`rounded-xl border p-4 shadow-sm ${
                          idx % 2 === 0 ? "border-green-200 bg-white" : "border-green-200 bg-green-50/40"
                        }`}
                      >
                        <h3 className="break-words text-base font-bold text-gray-900">
                          {result.quiz_title}
                        </h3>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">Chapter</span>
                            <span className="break-words text-right font-semibold text-gray-900">{result.chapter}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">Subject</span>
                            <span className="break-words text-right font-semibold text-gray-900">{result.subject}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">Grade</span>
                            <span className="font-semibold text-gray-900">{result.grade}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">Score</span>
                            <span className="font-semibold text-gray-900">
                              {result.marks_obtained} / {result.totalMarks}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">%</span>
                            <span className="font-semibold text-gray-900">{result.percentage}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">Letter</span>
                            <span className="inline-flex items-center justify-center rounded-full border border-green-200 bg-white/80 px-2.5 py-1 font-bold text-gray-900">
                              {result.grade_letter}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-600">Completed</span>
                            <span className="text-right font-semibold text-gray-900">{formatFriendlyDate(result.attempted_on)}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                    {visibleMobileRows.length < filteredRows.length ? (
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + 10)}
                        className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-green-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                      >
                        Show more
                      </button>
                    ) : null}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block md:max-h-[60vh]">
                    <table className="min-w-full text-sm md:text-base">
                      <caption className="sr-only">
                        Student quiz history table showing quiz, chapter, subject, grade, score, percentage, letter grade, and completion date.
                      </caption>
                      <thead className="sticky top-0 z-10 bg-green-100 text-green-900 font-bold">
                        <tr>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-left">Quiz</th>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-left">Chapter</th>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-left">Subject</th>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-center">Grade</th>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-center">Score</th>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-center">%</th>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-center">Letter</th>
                          <th scope="col" className="px-4 py-3 border-b border-green-200 text-center">Completed</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredRows.map((result, idx) => (
                          <tr
                            key={idx}
                            className={`transition ${
                              idx % 2 === 0 ? "bg-white" : "bg-green-50/40"
                            } hover:bg-green-50`}
                          >
                            <td className="break-words px-4 py-3 border-b border-green-100 font-semibold text-gray-900">
                              {result.quiz_title}
                            </td>

                            <td className="break-words px-4 py-3 border-b border-green-100 text-gray-800">
                              {result.chapter}
                            </td>

                            <td className="break-words px-4 py-3 border-b border-green-100 text-gray-800">
                              {result.subject}
                            </td>

                            <td className="px-4 py-3 border-b border-green-100 text-center font-semibold">
                              {result.grade}
                            </td>

                            <td className="px-4 py-3 border-b border-green-100 text-center">
                              <div className="inline-flex items-center justify-center gap-2">
                                <span className="rounded-full border border-green-200 bg-white/80 px-2 py-0.5 font-bold text-gray-800">
                                  {result.marks_obtained} / {result.totalMarks}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3 border-b border-green-100 text-center font-bold text-gray-900">
                              {result.percentage}%
                            </td>

                            <td className="px-4 py-3 border-b border-green-100 text-center">
                              <span className="rounded-full border border-green-200 bg-white/80 px-2.5 py-1 font-extrabold text-gray-900">
                                {result.grade_letter}
                              </span>
                            </td>

                            <td className="px-4 py-3 border-b border-green-100 text-center text-gray-800">
                              {formatFriendlyDate(result.attempted_on)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-green-200 bg-white px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-700">
                  Tip: Click any quiz from Landing Page to attempt again.
                </div>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white/70 px-4 py-2 font-bold text-green-900 shadow-sm transition hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  Go to Quizzes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentQuizHistoryTable;
