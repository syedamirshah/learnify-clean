import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import CTAButton from "../../components/public/CTAButton";
import SectionHeader from "../../components/public/SectionHeader";
import StatCard from "../../components/public/StatCard";
import TrustBadge from "../../components/public/TrustBadge";
import PublicSection from "../../components/public/PublicSection";
import axiosInstance from "../../utils/axiosInstance";
import { persistStudentGrade } from "../../utils/auth";
import {
  buildPaymentChooseUrl,
  needsPaymentRedirect,
  paymentRedirectMessage,
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

      if (needsPaymentRedirect(statusFromToken, roleFromToken)) {
        alert(`${paymentRedirectMessage(statusFromToken)} Redirecting to payment page...`);
        setTimeout(() => {
          window.location.href = buildPaymentChooseUrl(API, username);
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
      if (userData.username) localStorage.setItem("username", userData.username);
      localStorage.setItem("user_full_name", fullName);
      localStorage.setItem("user_role", role);
      persistStudentGrade(userData);

      if (role !== "student" && role !== "teacher" && role !== "school_admin") {
        alert("Admins and Managers must log in from backend.");
        return;
      }

      if (needsPaymentRedirect(status, role)) {
        alert(`${paymentRedirectMessage(status)} Redirecting to payment page...`);
        setTimeout(() => {
          window.location.href = buildPaymentChooseUrl(API, username);
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

  const screenshotClass =
    "w-full rounded-xl border border-green-100 bg-white shadow-sm transition duration-200 hover:shadow-md";

  return (
    <div
      className="relative min-h-screen bg-white text-gray-900"
      style={{
        fontFamily: '"Plus Jakarta Sans", Inter, Nunito, system-ui, -apple-system, sans-serif',
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-green-100/60 blur-3xl" />
        <div className="absolute top-32 -right-28 h-72 w-72 rounded-full bg-amber-50/80 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-50/70 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-green-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-2 px-4 py-2 sm:py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
            <img
              src={logo}
              alt="Learnify Pakistan Logo"
              className="h-12 w-auto object-contain sm:h-[68px] md:h-[82px]"
            />

            <div className="flex flex-col justify-center leading-none">
              <h1 className="text-[18px] font-extrabold tracking-tight text-gray-900 sm:text-[24px] md:text-[30px]">
                Learnify Pakistan
              </h1>

              <p className="mt-1 text-[11px] font-semibold text-[#42b72a] sm:text-[14px] md:text-[18px]">
                Practicing Math Responsibly
              </p>
            </div>
          </div>

          <nav className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
            <CTAButton to="/school-onboarding" className="col-span-2 px-4 py-2 sm:col-span-1">
              School Onboarding
            </CTAButton>
            <CTAButton href="#login-card" variant="secondary" className="px-4 py-2">
              Login
            </CTAButton>
            <CTAButton to="/signup" variant="secondary" className="px-4 py-2">
              Sign Up
            </CTAButton>
            <CTAButton to="/learn" className="col-span-2 px-4 py-2 sm:col-span-1">
              Enter as Guest
            </CTAButton>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-green-100 bg-transparent">
          <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 sm:pt-10">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-center">
              <TrustBadge>Curriculum Aligned</TrustBadge>
              <TrustBadge>Instant Feedback</TrustBadge>
              <TrustBadge>Trusted by Schools</TrustBadge>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-stretch gap-6 px-4 pb-10 sm:gap-10 sm:pb-14 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-full rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 via-white to-amber-50/40 p-5 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#42b72a]">
                For Schools
              </p>

              <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">
                AI-powered learning analytics for your entire school.
              </h2>

              <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
                Give principals and coordinators a single dashboard to monitor student progress,
                support teachers, track tasks, and onboard your community with confidence.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Monitor" value="School-wide performance" />
                <StatCard label="Support" value="Teachers & classrooms" accent="blue" />
                <StatCard label="Onboard" value="Bulk roster upload" accent="gold" />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CTAButton to="/school-onboarding" className="w-full sm:w-auto">
                  School Onboarding
                </CTAButton>
                <CTAButton
                  href={SCHOOL_TEMPLATE_URL}
                  download
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Download Template
                </CTAButton>
              </div>
            </div>

            <div
              id="login-card"
              className="h-full rounded-3xl border border-green-100 bg-white p-5 shadow-sm sm:p-7"
            >
              <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">Login to Continue</h3>
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#42b72a] focus:ring-2 focus:ring-green-100"
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#42b72a] focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <CTAButton type="button" onClick={handleLogin} className="mt-5 w-full">
                Login
              </CTAButton>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link to="/learn" className="font-medium text-[#42b72a] hover:underline">
                  Continue as Guest
                </Link>
                <Link to="/signup" className="font-medium text-[#42b72a] hover:underline">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </section>

        <PublicSection>
          <SectionHeader
            eyebrow="Product highlights"
            title="How Learnify Supports Learning"
            description="Each feature of Learnify is designed to support structured learning, regular practice, and clear progress visibility."
          />

          <div className="mt-12 space-y-16">
            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-green-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md lg:grid-cols-2 lg:p-8">
              <div>
                <h4 className="text-2xl font-extrabold text-gray-900">Aligned with National Curriculum and Official Textbooks</h4>
                <p className="mt-4 text-base leading-8 text-gray-600">
                  Learnify exercises follow the official textbook sequence chapter by chapter, so students build understanding in a structured progression.
                  This curriculum alignment makes the platform easy to integrate into school routines and classroom learning plans.
                </p>
              </div>
              <div className="rounded-3xl border border-green-100 bg-green-50/50 p-3 shadow-sm">
                <img src={textbookExercises} alt="Textbook exercises preview" className={screenshotClass} />
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-green-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md lg:grid-cols-2 lg:p-8">
              <div className="order-2 lg:order-1 rounded-3xl border border-green-100 bg-blue-50/50 p-3 shadow-sm">
                <img src={resultsTable} alt="Progress results preview" className={screenshotClass} />
              </div>
              <div className="order-1 lg:order-2">
                <h4 className="text-2xl font-extrabold text-gray-900">Track Progress Clearly</h4>
                <p className="mt-4 text-base leading-8 text-gray-600">
                  The quiz history and results view makes performance easy to read through marks, percentages, and attempt history.
                  Students and teachers can identify weak areas quickly and monitor improvement over time with confidence.
                </p>
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-green-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md lg:grid-cols-2 lg:p-8">
              <div>
                <h4 className="text-2xl font-extrabold text-gray-900">Unlimited, Affordable Practice</h4>
                <p className="mt-4 text-base leading-8 text-gray-600">
                  Learnify supports both Learning Mode and Exam Mode with unlimited attempts, giving students space to practice repeatedly.
                  Since new questions are randomized each attempt, learners improve understanding instead of memorizing fixed answer patterns.
                </p>
              </div>
              <div className="rounded-3xl border border-green-100 bg-amber-50/50 p-3 shadow-sm">
                <img src={quizAttempt} alt="Quiz experience preview" className={screenshotClass} />
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-green-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md lg:grid-cols-2 lg:p-8">
              <div className="order-2 lg:order-1 space-y-4">
                <div className="rounded-3xl border border-green-100 bg-green-50/50 p-3 shadow-sm transition duration-200 hover:shadow-md">
                  <img src={topicIndex} alt="Topic Practice preview" className={screenshotClass} />
                </div>
                <div className="rounded-3xl border border-green-100 bg-blue-50/50 p-3 shadow-sm transition duration-200 hover:shadow-md">
                  <img src={weeklyPlan} alt="Weekly Plan preview" className={screenshotClass} />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h4 className="text-2xl font-extrabold text-gray-900">Multiple Ways to Organize Learning</h4>
                <p className="mt-4 text-base leading-8 text-gray-600">
                  Learnify offers three complementary learning paths: Textbook Exercises, Topic Index, and Weekly Plan.
                  Learners can follow textbook structure for guided progression or switch to topic-based and week-based practice for flexible revision.
                </p>
              </div>
            </article>

            <article className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-green-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md lg:grid-cols-2 lg:p-8">
              <div>
                <h4 className="text-2xl font-extrabold text-gray-900">
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

              <div className="rounded-3xl border border-green-100 bg-green-50/50 p-3 shadow-sm">
                <img
                  src={teacherTasks}
                  alt="Teacher assigning and monitoring quiz tasks"
                  className={screenshotClass}
                />
              </div>
            </article>
          </div>
        </PublicSection>
      </main>

      <footer className="border-t border-green-100 bg-green-50/40">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-4 py-7 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <div className="font-extrabold text-gray-900">Learnify</div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/membership" className="hover:text-[#42b72a] hover:underline">
              Membership
            </Link>
            <Link to="/help-center" className="hover:text-[#42b72a] hover:underline">
              Help Center
            </Link>
            <Link to="/honor-board" className="hover:text-[#42b72a] hover:underline">
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
