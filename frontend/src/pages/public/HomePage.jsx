import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import axiosInstance from "../../utils/axiosInstance";
import { persistStudentGrade } from "../../utils/auth";
import textbookExercises from "@/assets/screenshots/textbook-exercises.png";
import topicIndex from "@/assets/screenshots/topic-index.png";
import weeklyPlan from "@/assets/screenshots/weekly-plan.png";
import quizAttempt from "@/assets/screenshots/quiz-attempt.png";
import resultsTable from "@/assets/screenshots/results-table.png";
import teacherTasks from "@/assets/screenshots/teacher-tasks.png";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;

const HomePage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const getNextPath = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      if (!next || typeof next !== "string") return "/learn";
      if (!next.startsWith("/")) return "/learn";
      if (next.startsWith("//")) return "/learn";
      return next;
    } catch {
      return "/learn";
    }
  };

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

      if (statusFromToken === "expired") {
        alert("Your subscription has expired. Redirecting to payment page...");
        setTimeout(() => {
          window.location.href = `${API}payments/choose/`;
        }, 500);
        return;
      }

      const userRes = await axiosInstance.get("user/me/", {
        headers: { Authorization: `Bearer ${access}` },
      });

      const userData = userRes.data;
      const status = userData.account_status;
      const role = userData.role;
      const fullName = userData.full_name;

      localStorage.setItem("account_status", status);
      localStorage.setItem("user_full_name", fullName);
      localStorage.setItem("user_role", role);
      persistStudentGrade(userData);

      if (role !== "student" && role !== "teacher") {
        alert("Admins and Managers must log in from backend.");
        return;
      }

      if (status === "expired") {
        alert("Your subscription has expired. Redirecting to payment page...");
        setTimeout(() => {
          window.location.href = `${API}payments/choose/`;
        }, 500);
        return;
      }

      const nextPath = getNextPath();
      window.location.href = nextPath || "/learn";
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
      className="min-h-screen bg-white text-gray-900"
      style={{
        fontFamily: '"Plus Jakarta Sans", Inter, Nunito, system-ui, -apple-system, sans-serif',
      }}
    >
      <header className="sticky top-0 z-20 border-b border-green-100 bg-white/95 backdrop-blur-sm">
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
            <a
              href="#login-card"
              className="rounded-md border border-green-300 bg-white px-4 py-2 text-center text-sm font-semibold text-green-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-green-50 hover:shadow"
            >
              Login
            </a>
            <Link
              to="/signup"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow"
            >
              Sign Up
            </Link>
            <Link
              to="/learn"
              className="col-span-2 rounded-md bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow sm:col-span-1"
            >
              Enter as Guest
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-green-100 bg-white">
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-4 py-6 sm:gap-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:py-16">
            <div className="rounded-2xl border border-green-200 bg-white p-4 shadow-md sm:rounded-3xl sm:p-6 lg:p-8">
              <p className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-green-700">
                Entry Page
              </p>

              <h2 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-[#0f5132] sm:mt-4 sm:text-4xl lg:text-6xl">
                Master Math with Confidence
              </h2>

              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-700 sm:mt-5 sm:text-lg sm:leading-8">
                Enter the platform to explore textbook exercises, topic practice,
                weekly learning plans, and clear progress tracking in one focused
                math environment.
              </p>
            </div>

            <div
              id="login-card"
              className="rounded-2xl border border-green-200 bg-white p-4 shadow-md sm:p-6"
            >
              <h3 className="text-2xl font-bold text-[#0f5132]">Login to Continue</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Existing student and teacher accounts can sign in here and continue to
                the main learning page.
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
                    className="w-full rounded-lg border border-[#cfe2d4] bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#118C4F] focus:ring-2 focus:ring-[#118C4F]/15"
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
                    className="w-full rounded-lg border border-[#cfe2d4] bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#118C4F] focus:ring-2 focus:ring-[#118C4F]/15"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                className="mt-5 w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-green-700 hover:shadow-md"
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

        <section className="mx-auto max-w-[1240px] px-4 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h3 className="text-4xl font-extrabold tracking-tight text-green-900 sm:text-5xl">
              How Learnify Supports Learning
            </h3>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Each feature of Learnify is designed to support structured learning, regular practice, and clear progress visibility.
            </p>
          </div>

          <div className="mt-12 space-y-16">
            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-green-200 bg-white p-6 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-2 lg:p-8">
              <div>
                <h4 className="text-2xl font-semibold text-[#0f5132]">Aligned with National Curriculum and Official Textbooks</h4>
                <p className="mt-4 text-base leading-8 text-gray-600">
                  Learnify exercises follow the official textbook sequence chapter by chapter, so students build understanding in a structured progression.
                  This curriculum alignment makes the platform easy to integrate into school routines and classroom learning plans.
                </p>
              </div>
              <div className="rounded-xl border border-green-200 bg-white p-3 shadow-sm">
                <img src={textbookExercises} alt="Textbook exercises preview" className={screenshotClass} />
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-green-200 bg-white p-6 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-2 lg:p-8">
              <div className="order-2 lg:order-1 rounded-xl border border-green-200 bg-white p-3 shadow-sm">
                <img src={resultsTable} alt="Progress results preview" className={screenshotClass} />
              </div>
              <div className="order-1 lg:order-2">
                <h4 className="text-2xl font-semibold text-[#0f5132]">Track Progress Clearly</h4>
                <p className="mt-4 text-base leading-8 text-gray-600">
                  The quiz history and results view makes performance easy to read through marks, percentages, and attempt history.
                  Students and teachers can identify weak areas quickly and monitor improvement over time with confidence.
                </p>
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-green-200 bg-white p-6 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-2 lg:p-8">
              <div>
                <h4 className="text-2xl font-semibold text-[#0f5132]">Unlimited, Affordable Practice</h4>
                <p className="mt-4 text-base leading-8 text-gray-600">
                  Learnify supports both Learning Mode and Exam Mode with unlimited attempts, giving students space to practice repeatedly.
                  Since new questions are randomized each attempt, learners improve understanding instead of memorizing fixed answer patterns.
                </p>
              </div>
              <div className="rounded-xl border border-green-200 bg-white p-3 shadow-sm">
                <img src={quizAttempt} alt="Quiz experience preview" className={screenshotClass} />
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-green-200 bg-white p-6 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-2 lg:p-8">
              <div className="order-2 lg:order-1 space-y-4">
                <div className="rounded-xl border border-green-200 bg-white p-3 shadow-sm">
                  <img src={topicIndex} alt="Topic Practice preview" className={screenshotClass} />
                </div>
                <div className="rounded-xl border border-green-200 bg-white p-3 shadow-sm">
                  <img src={weeklyPlan} alt="Weekly Plan preview" className={screenshotClass} />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h4 className="text-2xl font-semibold text-[#0f5132]">Multiple Ways to Organize Learning</h4>
                <p className="mt-4 text-base leading-8 text-gray-600">
                  Learnify offers three complementary learning paths: Textbook Exercises, Topic Index, and Weekly Plan.
                  Learners can follow textbook structure for guided progression or switch to topic-based and week-based practice for flexible revision.
                </p>
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-green-200 bg-white p-6 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-2 lg:p-8">
              <div>
                <h4 className="text-2xl font-semibold text-[#0f5132]">
                  Support for Teachers
                </h4>

                <p className="mt-4 text-base leading-8 text-gray-600">
                  Learnify helps teachers monitor student learning outcomes clearly and efficiently.
                  Teachers can view quiz performance, identify weak areas, and understand where
                  students need additional support.
                </p>

                <p className="mt-4 text-base leading-8 text-gray-600">
                  The platform also allows teachers to assign structured quiz tasks to an entire
                  grade or to specific students. By automating practice tracking and performance
                  visibility, Learnify saves valuable time and allows teachers to focus more on
                  planning lessons and supporting student understanding.
                </p>
              </div>

              <div className="rounded-xl border border-green-200 bg-white p-3 shadow-sm">
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

      <footer className="border-t border-green-100 bg-green-50/30">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-4 py-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <div className="font-semibold text-[#0f5132]">Learnify</div>
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
