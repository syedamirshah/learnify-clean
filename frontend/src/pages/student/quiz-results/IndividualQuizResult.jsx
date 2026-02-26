import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import logo from "../../../assets/logo.png";
import AppLayout from "../../../components/layout/AppLayout";

const IndividualQuizResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await axiosInstance.get(`/student/quiz-result/${attemptId}/`);

        console.log("Fetched Result:", response.data);

        // Patch to add missing fields for frontend display
        const data = response.data;
        const patchedResult = {
          ...data,
          grade_letter: data.grade_letter || data.grade || "N/A",
          incorrect_answers:
            (data.total_questions || 0) - (data.correct_answers || 0),
        };

        setResult(patchedResult);
      } catch (error) {
        console.error("Error fetching quiz result:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  useEffect(() => {
    setCurrentUserRole(localStorage.getItem("user_role"));
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
    setCurrentUserRole(null);
    setUserFullName("");
    navigate("/", { replace: true });
  };

  const navItems = [
    { key: "home", label: "Home", href: "/" },
    { key: "why-join", label: "Why Join Learnify?", href: "/why-join" },
    ...(currentUserRole === "student"
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
    ...(currentUserRole === "teacher"
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
    ...(!currentUserRole
      ? [
          {
            key: "sign-up",
            label: "Sign up",
            href: "/signup",
            children: [{ key: "create-account", label: "Create Account", href: "/signup" }],
          },
        ]
      : []),
  ];

  const renderAnswer = (ans) => {
    if (!ans || ans === "") return <span className="text-gray-400 italic">No answer</span>;
    if (Array.isArray(ans)) return ans.join(", ");
    if (typeof ans === "object") return Object.entries(ans).map(([k, v]) => `${k}: ${v}`).join(", ");
    return ans;
  };

  if (loading) {
    return (
      <AppLayout
        className="font-[Nunito]"
        logoSrc={logo}
        logoAlt="Learnify Pakistan Logo"
        brandTitle="Learnify Pakistan"
        brandMotto="Learning with Responsibility"
        isAuthenticated={Boolean(currentUserRole)}
        userFullName={userFullName}
        navItems={navItems}
        isMobileDrawerOpen={mobileDrawerOpen}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
        onLogoutClick={handleLogout}
      >
        <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto max-w-xl rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
            <p className="text-green-900 font-semibold">Loading quiz result...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!result) {
    return (
      <AppLayout
        className="font-[Nunito]"
        logoSrc={logo}
        logoAlt="Learnify Pakistan Logo"
        brandTitle="Learnify Pakistan"
        brandMotto="Learning with Responsibility"
        isAuthenticated={Boolean(currentUserRole)}
        userFullName={userFullName}
        navItems={navItems}
        isMobileDrawerOpen={mobileDrawerOpen}
        onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
        onLogoutClick={handleLogout}
      >
        <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] px-4 sm:px-6 lg:px-8 py-8">
          <div aria-live="polite" className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="text-red-700 font-semibold">Failed to load result.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Learning with Responsibility"
      isAuthenticated={Boolean(currentUserRole)}
      userFullName={userFullName}
      navItems={navItems}
      isMobileDrawerOpen={mobileDrawerOpen}
      onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
      onLogoutClick={handleLogout}
      mobileAuthContent={
        currentUserRole ? (
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
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6]">
        <section className="w-full border-b border-green-100 bg-white/70 px-4 sm:px-6 lg:px-8 py-5">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold text-green-700">Result Summary</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-gray-900">Quiz Result</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600 break-words">
              {result.quiz_title || "Quiz"}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">
          <div className="rounded-2xl border border-green-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Questions" value={result.total_questions} />
              <StatCard label="Correct" value={result.correct_answers} />
              <StatCard label="Incorrect" value={result.incorrect_answers} />
              <StatCard label="Marks" value={result.marks_obtained} />
              <StatCard label="Percentage" value={`${result.percentage}%`} />
              <StatCard label="Grade" value={result.grade_letter} />
            </div>
          </div>

          {result.questions?.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-green-900">Answer Review</h2>
              <div className="space-y-4">
                {result.questions.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-500">Question {index + 1}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                          item.is_correct
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.is_correct ? "Correct" : "Incorrect"}
                      </span>
                    </div>

                    <p className="mb-2 font-semibold text-gray-900">Question:</p>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mb-3 text-sm sm:text-base text-gray-800 break-words">
                      {item.question_text}
                    </div>

                    <p className="text-sm sm:text-base text-gray-800 break-words">
                      <span className="font-semibold">Your Answer: </span>
                      {renderAnswer(item.student_answer)}
                    </p>
                    <p className="mt-1 text-sm sm:text-base text-gray-800 break-words">
                      <span className="font-semibold">Correct Answer: </span>
                      {renderAnswer(item.correct_answer)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500 shadow-sm">
              No questions were answered.
            </div>
          )}

          <div className="rounded-2xl border border-green-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-2.5 font-semibold text-white hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              >
                Go Back to Quizzes
              </Link>
              <Link
                to="/student/quiz-history"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-2.5 font-semibold text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              >
                See Your Result History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const StatCard = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-3 min-w-0">
    <p className="text-xs font-medium text-gray-500 break-words">{label}</p>
    <p className="mt-1 text-lg font-extrabold text-gray-900 break-words">{value ?? "N/A"}</p>
  </div>
);

export default IndividualQuizResult;
