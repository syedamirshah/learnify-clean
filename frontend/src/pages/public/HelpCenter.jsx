import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";

const HelpCenter = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const supportEmail = "support@learnifypakistan.com";

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
    ...(!role
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

  const categories = useMemo(
    () => [
      {
        title: "For Students",
        items: [
          "How to attempt a quiz",
          "Retaking quizzes (practice again)",
          "Viewing your results and answers",
          "Understanding Shining Stars & National Heroes",
        ],
      },
      {
        title: "For Parents",
        items: [
          "Understanding your child’s progress",
          "Subscription plans and renewals",
          "Payment and fee receipt upload",
          "What happens when subscription expires",
        ],
      },
      {
        title: "For Teachers & Schools",
        items: [
          "Viewing students’ results",
          "How assessments work",
          "Common classroom use tips",
          "Account and profile updates",
        ],
      },
      {
        title: "Membership & Billing",
        items: [
          "What is included in membership",
          "Preview mode (guest experience)",
          "Renewing an expired account",
          "Payment confirmation and processing",
        ],
      },
      {
        title: "Technical Help",
        items: [
          "Login issues",
          "Changing password",
          "Updating profile picture",
          "Basic troubleshooting (browser / internet)",
        ],
      },
    ],
    []
  );

  // Hover details for Quick Help Topics
  const topicDetails = useMemo(
    () => ({
      // Students
      "How to attempt a quiz":
        "Open a quiz, then answer one question at a time. When you press Next, your answer is saved. At the end, you’ll see your result and the correct answers.",
      "Retaking quizzes (practice again)":
        "You can attempt the same exercise again for practice. Retakes help you learn better. In most cases, the system keeps the latest result for reporting.",
      "Viewing your results and answers":
        "Go to the Assessment section. You can view: (1) Quiz Result Summary, (2) Individual Quiz Result (correct/incorrect answers), and (3) Performance views (subject-wise and grade-level).",
      "Understanding Shining Stars & National Heroes":
        "These are positive recognition categories based on total marks and the number of exercises attempted. Shining Stars is calculated monthly, while National Heroes is calculated quarterly.",

      // Parents
      "Understanding your child’s progress":
        "Use the Assessment views to see quiz history, correct/incorrect answers, and performance trends. This helps you support learning at home with clarity.",
      "Subscription plans and renewals":
        "Membership gives full access to exercises and assessments. If your account expires, you’ll be guided to renew after login.",
      "Payment and fee receipt upload":
        "During signup or renewal, you may upload a fee receipt. If any payment issue happens, support can verify using your receipt screenshot.",
      "What happens when subscription expires":
        "After expiry, the system guides you to the renewal flow. You may be signed out after submitting a renewal request and continue as guest until activation.",

      // Teachers & Schools
      "Viewing students’ results":
        "Teachers can view student assessment records based on their school/city setup. This helps track learning outcomes and identify weak areas.",
      "How assessments work":
        "Exercises are structured by grade, subject, and chapter. Results include quiz summary, detailed answer review, and performance views for improvement tracking.",
      "Common classroom use tips":
        "Use Learnify for short daily practice, homework-style exercises, and quick revision before tests. Encourage retakes to strengthen learning.",
      "Account and profile updates":
        "Users can update profile fields from Edit Profile. Profile picture can be updated from Edit Profile or directly from the profile page.",

      // Membership & Billing
      "What is included in membership":
        "Membership gives full access to exercises, instant feedback, progress tracking, and recognition (Shining Stars / National Heroes).",
      "Preview mode (guest experience)":
        "Guests can view all exercises, but they can attempt only 3 questions in preview mode. Preview attempts are not graded and do not create official results.",
      "Renewing an expired account":
        "If your account expires, you’ll be redirected to renewal after login. After submitting renewal, you may be signed out and can continue as guest until activation.",
      "Payment confirmation and processing":
        "Payments are handled through Easypaisa and processed automatically. If something fails or delays, support can help after verification.",

      // Technical
      "Login issues":
        "Check username/password, confirm internet connection, then try again. If still stuck, email support with your username.",
      "Changing password":
        "Go to Edit Profile and use the Change Password section. If you can’t log in, contact support for help.",
      "Updating profile picture":
        "You can upload/change your picture in Edit Profile, or from the Profile page using the small pencil icon near your picture.",
      "Basic troubleshooting (browser / internet)":
        "Refresh the page, try re-login, and check your internet. If issues continue, try another browser or clear cache.",
    }),
    []
  );

  const faqs = useMemo(
    () => [
      {
        q: "Can I use Learnify Pakistan without subscription?",
        a: "Yes. In preview mode, guests can view all exercises and attempt only the first 3 questions. These preview attempts are not graded and do not create official results. For full access and saved results, you need membership.",
      },
      {
        q: "How do I attempt a quiz?",
        a: "Open an exercise and answer one question at a time. When you press Next, your answer is saved. After finishing, you will see your result and correct answers.",
      },
      {
        q: "Can students retake quizzes?",
        a: "Yes. Students can retake exercises for learning and practice. Retakes help improvement, and the system typically keeps the latest result for reporting.",
      },
      {
        q: "What do Shining Stars and National Heroes mean?",
        a: "These are recognition categories based on total marks and the number of exercises attempted. Shining Stars is calculated monthly, while National Heroes is calculated quarterly. The goal is motivation with dignity and consistency.",
      },
      {
        q: "Where can I see the result?",
        a: "Results are inside the Assessment menu. You will usually find three types: (1) Quiz Result Summary (overall score), (2) Individual Quiz Result (question-by-question correct/incorrect answers), and (3) Performance views (subject-wise and grade-level progress).",
      },
      {
        q: "What does “subject-wise performance” mean?",
        a: "Subject-wise performance shows how you are doing in each subject compared to your own learning history. It helps you identify strong and weak subjects. In simple words, it works like a “position” or “standing” indicator (similar to the idea of percentile) — it tells you whether your performance is low, average, or high within that subject based on your attempts and results.",
      },
      {
        q: "My grade is not showing correctly. What should I do?",
        a: "First, refresh the page and re-login. Then go to Account Settings → Edit Profile and check your grade. If it still doesn’t show correctly, email support with your username.",
      },
      {
        q: "Can I change my grade anytime?",
        a: "Grade changes may be restricted (for example, once per year) to keep learning records consistent. If you cannot change it, contact support for guidance.",
      },
      {
        q: "How does renewal work when subscription expires?",
        a: "If your account expires, you may be redirected to the renewal page after login. After submitting a renewal request, you may be signed out and can continue as guest until activation.",
      },
      {
        q: "How do I upload or change profile picture?",
        a: "You can change your profile picture in two ways: (1) Go to Edit Profile and upload a new picture, or (2) Open your Profile page and use the small pencil/edit icon near your picture to change it.",
      },
      {
        q: "Can I remove my profile picture?",
        a: "If there is no “Remove” option, it means removal is not enabled yet. You can replace your picture anytime by uploading a new one. If you want a proper remove option, support can add it later.",
      },
      {
        q: "I paid fee but my account is still inactive. Why?",
        a: "Fee payment is handled through Easypaisa and processed automatically. If there is a delay or any issue, please email support at support@learnifypakistan.com and attach a copy/screenshot of your fee receipt. Our support team will verify and resolve it.",
      },
      {
        q: "What if a question was wrong?",
        a: "Questions are made with great care, but there can still be a mistake sometimes. If you find an error, take a screenshot (or note the grade, subject, chapter, and quiz name) and email it to support@learnifypakistan.com. We will review and correct it.",
      },
      {
        q: "I forgot my password. What can I do?",
        a: "If you are logged in, use Change Password inside Edit Profile. If you are logged out and cannot access your account, contact support with your username and registered email.",
      },
    ],
    []
  );

  const toggleFAQ = (idx) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

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
      <div className="min-h-[calc(100vh-180px)] bg-white text-gray-800">

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 pt-8 pb-8">
        <div className="overflow-hidden rounded-3xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-5 sm:p-6 md:p-10 shadow-sm">
          <h1 className="text-3xl md:text-4xl font-extrabold text-green-900">
            Help Center
          </h1>
          <p className="mt-2 max-w-3xl text-sm sm:text-base text-gray-700">
            We’re here to help students, parents, and schools get the best learning
            experience from Learnify Pakistan — exercises, results, membership, and
            account settings.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <Link
              to="/membership"
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white border border-green-200 hover:bg-gray-50 transition font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
            >
              Go to Membership
            </Link>
            <Link
              to="/signup"
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
            >
              Create Account
            </Link>
            <a
              href={`mailto:${supportEmail}`}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-green-700 text-white hover:bg-green-800 transition font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
            >
              Email Support
            </a>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/" className="rounded-xl border border-green-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300">
              Home
            </Link>
            <Link to="/membership" className="rounded-xl border border-green-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300">
              Membership
            </Link>
            <Link to="/honor-board" className="rounded-xl border border-green-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300">
              Honor Board
            </Link>
            <Link to="/signup" className="rounded-xl border border-green-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300">
              Sign up
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Quick Help Topics
        </h2>
        <p className="text-gray-600 mt-1">
          Hover on a topic to see quick guidance. For full details, use the FAQs below.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <div key={i} className="min-w-0 rounded-2xl border border-green-200 bg-white p-5 shadow-sm hover:shadow transition">
              <div className="text-lg font-bold text-green-900">{cat.title}</div>

              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {cat.items.map((t, idx) => (
                  <li key={idx} className="group relative pl-5">
                    <span className="absolute left-0 top-2 w-2 h-2 rounded-full bg-green-600" />
                    <span className="underline decoration-dotted underline-offset-4 cursor-help">
                      {t}
                    </span>

                    {/* Hover tooltip */}
                    <div className="pointer-events-none hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute z-20 left-0 top-full mt-2 w-[280px] rounded-xl border bg-white shadow-lg p-3 text-xs text-gray-700">
                      <div className="font-bold text-gray-900 mb-1">{t}</div>
                      <div className="leading-5">
                        {topicDetails[t] || "More details will be added here soon."}
                      </div>
                      <div className="mt-2 text-[11px] text-gray-500">
                        Tip: Use the Assessment menu for results and performance views.
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 text-xs text-gray-500">
                Want more details? Check FAQs below.
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-600 mt-1">
          Click a question to view the answer.
        </p>

        <div className="mt-4 space-y-3">
          {faqs.map((f, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="rounded-2xl border bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleFAQ(idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                >
                  <span className="font-semibold text-gray-900">{f.q}</span>
                  <span className="text-green-800 font-bold">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-gray-700 text-sm leading-6">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Support */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-10">
        <div className="rounded-2xl border bg-gray-50 p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-900">Still need help?</h3>
          <p className="text-gray-700 mt-2 max-w-3xl">
            If your issue is not solved here, email our support team. Please include
            your <span className="font-semibold">username</span> and a short description
            (and screenshot if possible).
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${supportEmail}`}
              className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
            >
              {supportEmail}
            </a>
            <span className="text-sm text-gray-600">
              Response time: usually 24–48 hours on working days.
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Learnify Pakistan is an educational support platform. Exercise results and
          reports are designed to help learning and practice.
        </p>
      </section>
      </div>
    </AppLayout>
  );
};

export default HelpCenter;
