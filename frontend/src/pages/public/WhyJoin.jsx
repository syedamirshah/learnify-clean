// File: src/pages/landing/WhyJoinLearnify.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import {
  FaBookOpen,
  FaBrain,
  FaChartBar,
  FaRedo,
  FaUserFriends,
  FaMoneyBillWave,
  FaChalkboardTeacher,
  FaGlobeAsia,
} from "react-icons/fa";

const WhyJoinLearnify = () => {
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

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

  const features = [
    {
      title: "Aligned with National Curriculum",
      icon: <FaBookOpen className="text-green-700 text-xl" />,
      accent: "border-green-200",
      description:
        "Every quiz is mapped to nationally and provincially approved textbooks for Grades 1–5, so students practice exactly what they learn in class — in the right sequence, with the right concepts.",
    },
    {
      title: "Smart Pedagogy",
      icon: <FaBrain className="text-pink-600 text-xl" />,
      accent: "border-pink-200",
      description:
        "Learn through real-life examples, simple explanations, and engaging practice — from basic to advanced — designed to build strong understanding step by step.",
    },
    {
      title: "Three Powerful Evaluation Modes",
      icon: <FaChartBar className="text-blue-700 text-xl" />,
      accent: "border-blue-200",
      description: (
        <ul className="list-disc ml-5 text-sm sm:text-base text-gray-700 space-y-1">
          <li>
            <span className="font-semibold text-gray-900">Instant Feedback:</span>{" "}
            Right/wrong answers instantly, with clear guidance.
          </li>
          <li>
            <span className="font-semibold text-gray-900">Progress Tracking:</span>{" "}
            See growth across subjects over time.
          </li>
          <li>
            <span className="font-semibold text-gray-900">Percentile Ranking:</span>{" "}
            Know how you’re doing compared to learners nationwide.
          </li>
        </ul>
      ),
    },
    {
      title: "Unlimited Quiz Attempts",
      icon: <FaRedo className="text-purple-700 text-xl" />,
      accent: "border-purple-200",
      description:
        "Practice as much as you want. Each attempt gives you new questions instead of repeating the same ones — so learning stays fresh, fun, and effective.",
    },
    {
      title: "Inclusive for Everyone",
      icon: <FaUserFriends className="text-amber-700 text-xl" />,
      accent: "border-amber-200",
      description:
        "Whether you’re in school or learning at home, Learnify is designed to support every child — accessible, inclusive, and full of opportunities to shine.",
    },
    {
      title: "Low-Cost, High-Impact",
      icon: <FaMoneyBillWave className="text-emerald-700 text-xl" />,
      accent: "border-emerald-200",
      description:
        "Premium learning at a price families can afford. We believe quality education should be within reach of every child in Pakistan.",
    },
    {
      title: "Empowering Teachers with Real-Time Insight",
      icon: <FaChalkboardTeacher className="text-indigo-700 text-xl" />,
      accent: "border-indigo-200",
      description:
        "Teachers can instantly view assignments, quiz attempts, and learning gaps — reducing manual checking and helping teachers focus on instruction, support, and lesson planning.",
    },
    {
      title: "Helping Parents Make Better School Choices",
      icon: <FaChartBar className="text-teal-700 text-xl" />,
      accent: "border-teal-200",
      description:
        "Clear performance insights help parents understand learning progress and compare academic outcomes — so they can make more informed decisions for their child’s education.",
    },
    {
      title: "Inspiring Healthy Academic Competition",
      icon: <FaChartBar className="text-cyan-800 text-xl" />,
      accent: "border-cyan-200",
      description:
        "By highlighting progress and outcomes, Learnify motivates schools and students to improve continuously — building a positive nationwide culture of learning and excellence.",
    },
    {
      title: "Driving National-Level Educational Research",
      icon: <FaGlobeAsia className="text-red-700 text-xl" />,
      accent: "border-red-200",
      description:
        "Learnify can generate anonymized insights across cities, regions, genders, sectors, and language groups — supporting researchers and policymakers to design fair, evidence-based interventions.",
    },
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
      <div className="min-h-[calc(100vh-180px)] bg-white text-gray-800">
      {/* Soft background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-green-100 blur-3xl opacity-70" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-emerald-100 blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-100 blur-3xl opacity-40" />
      </div>

      {/* Hero */}
      <header className="px-4 sm:px-6 lg:px-10 pt-8 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="rounded-3xl border border-green-200 bg-white/70 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10 md:py-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-800 border border-green-100">
                Learnify Pakistan • Grades 1–5
              </div>

              <h1 className="mt-4 text-2xl sm:text-3xl md:text-5xl font-extrabold text-green-900 leading-tight">
                Why Join Learnify Pakistan?
              </h1>

              <p className="mt-4 text-sm sm:text-base md:text-lg text-gray-700 max-w-3xl leading-relaxed">
                Learnify Pakistan is more than a quiz app — it’s a joyful learning journey
                for primary students, supportive for parents, and practical for teachers.
                Built around Pakistan’s National Curriculum and approved textbooks, Learnify
                blends smart practice and meaningful feedback to help every child grow with confidence.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/signup"
                  className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-green-700 px-5 py-3 text-white font-bold hover:bg-green-800 transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                >
                  Create Account
                </Link>
                <Link
                  to="/membership"
                  className="inline-flex w-full sm:w-auto justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-green-900 font-bold hover:bg-green-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                >
                  View Membership
                </Link>
              </div>
            </div>

            <div className="h-2 bg-gradient-to-r from-green-200 via-emerald-200 to-amber-200" />
          </div>
        </div>
      </header>

      {/* Feature grid */}
      <main className="px-4 sm:px-6 lg:px-10 pb-16">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {features.map((f, idx) => (
              <div
                key={`feature-${idx}`}
                className={`rounded-2xl border bg-white/80 shadow-sm hover:shadow transition p-5 sm:p-6 ${f.accent}`}
              >
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                    {f.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words leading-tight text-lg md:text-xl font-extrabold text-gray-900">
                        {f.title}
                      </h3>
                      
                    </div>

                    <div className="mt-2 text-sm sm:text-base text-gray-700 leading-relaxed">
                      {typeof f.description === "string" ? <p>{f.description}</p> : f.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm">
            <div className="text-sm sm:text-base md:text-base text-gray-700 leading-relaxed">
              <span className="font-bold text-gray-900">Our promise:</span>{" "}
              kid-friendly design, simple language, meaningful feedback, and a learning experience
              that respects Pakistan’s curriculum — while helping students, parents, and teachers
              work together for better results.
            </div>
          </div>
        </div>
      </main>
      </div>
    </AppLayout>
  );
};

export default WhyJoinLearnify;
