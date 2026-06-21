import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import axiosInstance from "../../utils/axiosInstance";
import { persistStudentGrade, persistSchoolSubscriptionContext } from "../../utils/auth";
import {
  buildPaymentRedirectContext,
  needsPaymentRedirect,
  paymentRedirectMessage,
  resolvePaymentRedirectUrl,
} from "../../utils/paymentRedirect";
import { resolvePostLoginPath } from "../../utils/roleRoutes";
import textbookExercises from "@/assets/screenshots/textbook-exercises.png";
import topicIndex from "@/assets/screenshots/topic-index.png";
import weeklyPlan from "@/assets/screenshots/weekly-plan.png";
import quizAttempt from "@/assets/screenshots/quiz-attempt.png";
import resultsTable from "@/assets/screenshots/results-table.png";
import teacherTasks from "@/assets/screenshots/teacher-tasks.png";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;
const SCHOOL_TEMPLATE_URL = "/student_bulk_upload_template.xlsx";

const HomePage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axiosInstance.post("token/", { username, password });
      const access = res.data.access;
      const refresh = res.data.refresh;
      const roleFromToken = res.data.role;
      const statusFromToken = res.data.account_status;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("role", roleFromToken);
      localStorage.setItem("account_status", statusFromToken);

      const userRes = await axiosInstance.get("user/me/", {
        headers: { Authorization: `Bearer ${access}` },
      });

      const userData = userRes.data;
      const status = userData.account_status;
      const role = userData.role;
      const fullName = userData.full_name;
      const paymentContext = buildPaymentRedirectContext(userData);

      localStorage.setItem("account_status", status);
      if (userData.username) localStorage.setItem("username", userData.username);
      localStorage.setItem("user_full_name", fullName);
      localStorage.setItem("user_role", role);
      persistStudentGrade(userData);
      persistSchoolSubscriptionContext(userData);

      if (role !== "student" && role !== "teacher" && role !== "school_admin") {
        alert("Admins and Managers must log in from backend.");
        return;
      }

      if (needsPaymentRedirect(status, role, paymentContext)) {
        alert(
          `${paymentRedirectMessage(status, role, paymentContext)} Redirecting to payment page...`
        );
        setTimeout(() => {
          window.location.href = resolvePaymentRedirectUrl(API, {
            role,
            username: userData.username || username,
            ...paymentContext,
          });
        }, 500);
        return;
      }

      window.location.href = resolvePostLoginPath(role, window.location.search);
    } catch (err) {
      if (err.response?.data?.detail) {
        alert("Login failed: " + err.response.data.detail);
      } else {
        alert("Login failed. Please check username/password.");
      }
      console.error("Login error:", err);
    }
  };

  const heroButtons = [
    {
      label: "Enter as Guest",
      to: "/learn",
      className:
        "inline-flex items-center justify-center rounded-md bg-[#118C4F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f7d47]",
    },
    {
      label: "Login",
      to: "#login-card",
      className:
        "inline-flex items-center justify-center rounded-md border border-[#118C4F] bg-white px-6 py-3 text-sm font-semibold text-[#118C4F] transition hover:bg-green-50",
      isAnchor: true,
    },
    {
      label: "Sign Up",
      to: "/signup",
      className:
        "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50",
    },
  ];

  const screenshotClass =
    "w-full rounded-xl border border-green-200 bg-white shadow-md transition duration-200 hover:shadow-lg";

  return (
    <div
      className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 text-gray-900"
      style={{
        fontFamily: '"Plus Jakarta Sans", Inter, Nunito, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* decorative background (subtle, no new assets) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute top-32 -right-28 h-72 w-72 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-lime-200/35 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-emerald-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-2 px-4 py-2 sm:py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
            <img
              src={logo}
              alt="Learnify Pakistan Logo"
              className="h-12 w-auto object-contain sm:h-[68px] md:h-[82px]"
            />

            <div className="flex flex-col justify-center leading-none">
              <h1
                className="text-[18px] font-extrabold tracking-tight text-[#2f5d3a] sm:text-[24px] md:text-[30px]"
                style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
              >
                Learnify Pakistan
              </h1>

              <p
                className="mt-1 text-[11px] font-bold italic text-[#2f7a43] sm:text-[14px] md:text-[18px]"
                style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
              >
                Practicing Math Responsibly
              </p>
            </div>
          </div>

          <nav className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
            <Link
              to="/school-onboarding"
              className="col-span-2 rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-extrabold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:col-span-1"
            >
              School Onboarding
            </Link>
            <a
              href="#login-card"
              className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-center text-sm font-bold text-emerald-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Login
            </a>
            <Link
              to="/signup"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-center text-sm font-bold text-gray-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Sign Up
            </Link>
            <Link
              to="/learn"
              className="col-span-2 rounded-xl bg-emerald-600 px-4 py-2 text-center text-sm font-extrabold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:col-span-1"
            >
              Enter as Guest
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-emerald-100/70 bg-transparent">
          <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 sm:pt-10">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-center text-xs font-semibold text-emerald-900">
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-emerald-200">Curriculum-aligned</span>
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-emerald-200">Instant feedback</span>
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-emerald-200">Progress tracking</span>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-stretch gap-6 px-4 pb-10 sm:gap-10 sm:pb-14 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-full rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 shadow-lg shadow-emerald-200/40 ring-1 ring-emerald-100 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                For Schools
              </p>

              <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-emerald-950 sm:text-4xl">
                AI-powered learning analytics for your entire school.
              </h2>

              <p className="mt-4 text-sm leading-7 text-gray-700 sm:text-base">
                Give principals and coordinators a single dashboard to monitor student progress,
                support teachers, track tasks, and onboard your community with confidence.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Monitor</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-950">School-wide performance</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Support</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-950">Teachers & classrooms</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Onboard</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-950">Bulk roster upload</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/school-onboarding"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:w-auto"
                >
                  School Onboarding
                </Link>
                <a
                  href={SCHOOL_TEMPLATE_URL}
                  download
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-300 bg-white px-6 py-3.5 text-sm font-extrabold text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:w-auto"
                >
                  Download Template
                </a>
              </div>
            </div>

            <div
              id="login-card"
              className="h-full rounded-3xl border border-emerald-300 bg-white/90 p-5 shadow-md shadow-emerald-200/30 backdrop-blur-sm sm:p-7"
            >
              <h3 className="text-2xl font-extrabold tracking-tight text-emerald-950">Login to Continue</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Existing student and teacher accounts can sign in and continue to the learning experience.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                className="mt-5 w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-sm transition duration-200 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Login
              </button>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link to="/learn" className="font-medium text-[#118C4F] hover:underline">
                  Continue as Guest
                </Link>
                <Link to="/signup" className="font-medium text-[#118C4F] hover:underline">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-800 shadow-sm ring-1 ring-emerald-200">
              Product highlights
            </p>
            <h3 className="mt-4 text-4xl font-extrabold tracking-tight text-emerald-950 sm:text-5xl">
              How Learnify Supports Learning
            </h3>
            <p className="mt-4 text-base leading-8 text-gray-700 sm:text-lg">
              Each feature of Learnify is designed to support structured learning, regular practice, and clear progress visibility.
            </p>
          </div>

          <div className="mt-12 space-y-16">
            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-emerald-200 bg-white/80 p-6 shadow-md shadow-emerald-200/30 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-2 lg:p-8">
              <div>
                <h4 className="text-2xl font-extrabold text-emerald-950">Aligned with National Curriculum and Official Textbooks</h4>
                <p className="mt-4 text-base leading-8 text-gray-700">
                  Learnify exercises follow the official textbook sequence chapter by chapter, so students build understanding in a structured progression.
                  This curriculum alignment makes the platform easy to integrate into school routines and classroom learning plans.
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-3 shadow-sm">
                <img src={textbookExercises} alt="Textbook exercises preview" className={screenshotClass} />
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-emerald-200 bg-white/80 p-6 shadow-md shadow-emerald-200/30 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-2 lg:p-8">
              <div className="order-2 lg:order-1 rounded-3xl border border-emerald-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-3 shadow-sm">
                <img src={resultsTable} alt="Progress results preview" className={screenshotClass} />
              </div>
              <div className="order-1 lg:order-2">
                <h4 className="text-2xl font-extrabold text-emerald-950">Track Progress Clearly</h4>
                <p className="mt-4 text-base leading-8 text-gray-700">
                  The quiz history and results view makes performance easy to read through marks, percentages, and attempt history.
                  Students and teachers can identify weak areas quickly and monitor improvement over time with confidence.
                </p>
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-emerald-200 bg-white/80 p-6 shadow-md shadow-emerald-200/30 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-2 lg:p-8">
              <div>
                <h4 className="text-2xl font-extrabold text-emerald-950">Unlimited, Affordable Practice</h4>
                <p className="mt-4 text-base leading-8 text-gray-700">
                  Learnify supports both Learning Mode and Exam Mode with unlimited attempts, giving students space to practice repeatedly.
                  Since new questions are randomized each attempt, learners improve understanding instead of memorizing fixed answer patterns.
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-lime-50 via-white to-emerald-50 p-3 shadow-sm">
                <img src={quizAttempt} alt="Quiz experience preview" className={screenshotClass} />
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-emerald-200 bg-white/80 p-6 shadow-md shadow-emerald-200/30 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-2 lg:p-8">
              <div className="order-2 lg:order-1 space-y-4">
                <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-3 shadow-sm transition duration-200 hover:shadow-md">
                  <img src={topicIndex} alt="Topic Practice preview" className={screenshotClass} />
                </div>
                <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-sky-50 via-white to-lime-50 p-3 shadow-sm transition duration-200 hover:shadow-md">
                  <img src={weeklyPlan} alt="Weekly Plan preview" className={screenshotClass} />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h4 className="text-2xl font-extrabold text-emerald-950">Multiple Ways to Organize Learning</h4>
                <p className="mt-4 text-base leading-8 text-gray-700">
                  Learnify offers three complementary learning paths: Textbook Exercises, Topic Index, and Weekly Plan.
                  Learners can follow textbook structure for guided progression or switch to topic-based and week-based practice for flexible revision.
                </p>
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-emerald-200 bg-white/80 p-6 shadow-md shadow-emerald-200/30 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-2 lg:p-8">
              <div>
                <h4 className="text-2xl font-extrabold text-emerald-950">
                  Support for Teachers
                </h4>

                <p className="mt-4 text-base leading-8 text-gray-700">
                  Learnify helps teachers monitor student learning outcomes clearly and efficiently.
                  Teachers can view quiz performance, identify weak areas, and understand where
                  students need additional support.
                </p>

                <p className="mt-4 text-base leading-8 text-gray-700">
                  The platform also allows teachers to assign structured quiz tasks to an entire
                  grade or to specific students. By automating practice tracking and performance
                  visibility, Learnify saves valuable time and allows teachers to focus more on
                  planning lessons and supporting student understanding.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-3 shadow-sm">
                <img
                  src={teacherTasks}
                  alt="Teacher assigning and monitoring quiz tasks"
                  className={screenshotClass}
                />
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 via-white to-sky-50/60">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-4 py-7 text-sm text-gray-700 md:flex-row md:items-center md:justify-between">
          <div className="font-extrabold text-emerald-950">Learnify</div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/membership" className="hover:text-[#118C4F] hover:underline">
              Membership
            </Link>
            <Link to="/help-center" className="hover:text-[#118C4F] hover:underline">
              Help Center
            </Link>
            <Link to="/honor-board" className="hover:text-[#118C4F] hover:underline">
              Honor Board
            </Link>
          </div>
          <div>© {new Date().getFullYear()} Learnify</div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
