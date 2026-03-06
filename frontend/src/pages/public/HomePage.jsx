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
import honorBoard from "@/assets/screenshots/honor-board.png";
import membership from "@/assets/screenshots/membership.png";

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

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 via-white to-teal-50 text-gray-900"
      style={{ fontFamily: '"Plus Jakarta Sans", Inter, Nunito, system-ui, -apple-system, sans-serif' }}
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-emerald-300/30 blur-[130px]" />
      <div className="pointer-events-none absolute right-0 top-[26rem] h-[420px] w-[420px] rounded-full bg-teal-300/25 blur-[130px]" />
      <div className="pointer-events-none absolute -left-24 bottom-[18rem] h-[360px] w-[360px] rounded-full bg-cyan-200/30 blur-[110px]" />

      <header className="sticky top-0 z-20 border-b border-white/20 bg-white/55 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={logo} alt="Learnify" className="h-14 w-14 object-contain sm:h-16 sm:w-16" />
            <div className="flex min-h-[56px] flex-col justify-center sm:min-h-[64px]">
              <h1 className="leading-none text-2xl font-black tracking-tight text-green-900 sm:text-3xl">Learnify Pakistan</h1>
              <p className="mt-1 leading-none text-sm font-bold italic text-green-700 sm:text-lg">Learning with Responsibility</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-sm font-semibold sm:gap-3">
            <Link to="/login" className="rounded-full px-3 py-1.5 text-green-900 transition duration-200 hover:scale-[1.03] hover:bg-white/70 hover:brightness-110">
              Login
            </Link>
            <Link to="/signup" className="rounded-full border border-white/20 bg-white/70 px-4 py-1.5 text-green-900 shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition duration-200 hover:scale-[1.03] hover:bg-white hover:brightness-110">
              Sign Up
            </Link>
            <Link to="/learn" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-white shadow-[0_12px_24px_rgba(16,185,129,0.35)] transition duration-200 hover:scale-[1.03] hover:brightness-110">
              Enter as Guest
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full bg-green-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />

          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-10 px-4 py-14 md:gap-12 md:py-16 lg:grid-cols-2 lg:items-start">
            <div className="relative z-10">
              <p className="inline-flex rounded-full border border-white/20 bg-white/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 backdrop-blur">
                Math Learning Platform
              </p>
              <h2 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-green-900 sm:text-5xl lg:text-6xl">
                Master Math with Confidence
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-700 md:text-xl">
                Build strong understanding through structured textbook exercises, focused topic practice,
                and guided weekly plans in one platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/learn" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(16,185,129,0.35)] transition duration-200 hover:scale-[1.03] hover:brightness-110">
                  Start Learning
                </Link>
                <Link to="/signup" className="rounded-full border border-white/20 bg-white/70 px-6 py-3 text-sm font-bold text-green-900 shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition duration-200 hover:scale-[1.03] hover:bg-white hover:brightness-110">
                  Sign Up
                </Link>
                <Link to="/learn" className="rounded-full border border-white/20 bg-white/70 px-6 py-3 text-sm font-bold text-gray-800 shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition duration-200 hover:scale-[1.03] hover:bg-white hover:brightness-110">
                  Enter as Guest
                </Link>
              </div>
              <p className="mt-3 text-sm text-gray-500">Try real exercises instantly, no signup required.</p>
            </div>

            <div className="relative z-10">
              <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/55 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl md:p-6">
                <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-3xl" />
                <h3 className="text-xl font-black text-green-900">Login to Continue</h3>
                <p className="mt-1 text-sm text-gray-600">Access your full learning experience.</p>
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2.5 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                  />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2.5 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="relative mt-4 w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 font-semibold text-white shadow-[0_14px_30px_rgba(16,185,129,0.35)] transition duration-200 hover:scale-[1.01] hover:brightness-110"
                >
                  <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-all duration-500 group-hover:left-[120%] group-hover:opacity-100" />
                  Login
                </button>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <Link to="/learn" className="font-semibold text-green-700 hover:underline">
                    Continue as Guest
                  </Link>
                  <Link to="/signup" className="font-semibold text-green-700 hover:underline">
                    Sign Up
                  </Link>
                </div>
              </div>

              <div className="mb-3 mt-6 text-sm font-semibold text-green-700">Textbook Exercises Preview</div>
              <img
                src={textbookExercises}
                alt="Textbook exercises preview"
                className="w-full rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition duration-300 hover:brightness-105"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-4 py-16">
          <div className="mb-6 text-center">
            <h3 className="text-3xl font-black text-green-900">Why Learnify Works</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {[
              ["Curriculum-Aligned Math Practice", "Practice aligned exercises organized for consistent progression."],
              ["Topic-Based Mastery", "Strengthen specific skills through focused topic practice paths."],
              ["Weekly Structured Learning", "Follow weekly plans to build routine and momentum."],
              ["Progress and Recognition", "Track outcomes and celebrate milestones with confidence."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-3xl border border-white/20 bg-white/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-105 md:col-span-3">
                <h4 className="text-lg font-black text-green-900">{title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-green-100/60 bg-white/80">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-16">
            <div className="mb-6 text-center">
              <h3 className="text-3xl font-black text-green-900">Learn in Three Ways</h3>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
              {[
                {
                  title: "Textbook Exercises",
                  desc: "Study chapter-wise exercises in textbook sequence.",
                  to: "/learn",
                  image: textbookExercises,
                  button: "Open Exercises",
                  span: "md:col-span-3",
                },
                {
                  title: "Topic Practice",
                  desc: "Practice by topic to strengthen targeted skills.",
                  to: "/topic-index",
                  image: topicIndex,
                  button: "Open Topics",
                  span: "md:col-span-3",
                },
                {
                  title: "Weekly Plan",
                  desc: "Follow structured weekly sets for steady progress.",
                  to: "/weekly-plan",
                  image: weeklyPlan,
                  button: "Open Weekly Plan",
                  span: "md:col-span-6",
                },
              ].map((card) => (
                <article key={card.title} className={`rounded-3xl border border-white/20 bg-white/70 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-105 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] ${card.span}`}>
                  <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-gray-200 shadow-xl">
                    <img
                      src={card.image}
                      alt={`${card.title} preview`}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <h4 className="mt-4 text-xl font-black text-green-900">{card.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.desc}</p>
                  <Link to={card.to} className="mt-4 inline-block rounded-full border border-white/20 bg-white/75 px-4 py-2 text-sm font-bold text-green-900 shadow-sm transition duration-200 hover:scale-[1.03] hover:bg-white hover:brightness-105">
                    {card.button}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-4 py-16">
          <div className="mb-6 text-center">
            <h3 className="text-3xl font-black text-green-900">Built for Students, Teachers, and Families</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-white/20 bg-white/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur transition duration-200 hover:scale-[1.01] hover:brightness-105">
              <h4 className="text-xl font-black text-green-900">Students</h4>
              <p className="mt-2 text-sm text-gray-600">Build confidence through structured, grade-aligned math practice.</p>
            </article>
            <article className="rounded-3xl border border-white/20 bg-white/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur transition duration-200 hover:scale-[1.01] hover:brightness-105">
              <h4 className="text-xl font-black text-green-900">Teachers</h4>
              <p className="mt-2 text-sm text-gray-600">Use a clear practice structure to guide students with consistency.</p>
            </article>
            <article className="rounded-3xl border border-white/20 bg-white/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur transition duration-200 hover:scale-[1.01] hover:brightness-105">
              <h4 className="text-xl font-black text-green-900">Families</h4>
              <p className="mt-2 text-sm text-gray-600">Support daily math progress with one focused and simple platform.</p>
            </article>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-4 py-16">
          <div className="mb-6 text-center">
            <h3 className="text-3xl font-black text-green-900">Results and Recognition</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Track performance clearly and celebrate achievement with visible milestones.
            </p>
          </div>
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-3">
            <article className="rounded-3xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur transition duration-200 hover:scale-[1.01] hover:brightness-105">
              <img
                src={quizAttempt}
                alt="Quiz experience"
                className="w-full rounded-xl border border-gray-200 shadow-xl"
              />
              <h4 className="mt-3 text-lg font-black text-green-900">Real Quiz Experience</h4>
            </article>
            <article className="rounded-3xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur transition duration-200 hover:scale-[1.01] hover:brightness-105">
              <img
                src={resultsTable}
                alt="Progress results"
                className="w-full rounded-xl border border-gray-200 shadow-xl"
              />
              <h4 className="mt-3 text-lg font-black text-green-900">Progress Tracking</h4>
            </article>
            <article className="rounded-3xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur transition duration-200 hover:scale-[1.01] hover:brightness-105">
              <img
                src={honorBoard}
                alt="Honor board preview"
                className="w-full rounded-xl border border-gray-200 shadow-xl"
              />
              <h4 className="mt-3 text-lg font-black text-green-900">Honor Board Recognition</h4>
              <Link to="/honor-board" className="mt-2 inline-block text-sm font-bold text-green-800 hover:underline">
                View Honor Board
              </Link>
            </article>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-2">
          <div className="rounded-3xl border border-white/20 bg-white/65 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl md:p-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
              <img
                src={membership}
                alt="Membership plans"
                className="w-full rounded-xl border border-gray-200 shadow-xl"
              />
              <div>
                <h3 className="text-3xl font-black text-green-900">Ready to Start Learning?</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  Enter instantly as a guest, or create your account to unlock your full learning journey.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to="/learn" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(16,185,129,0.35)] transition duration-200 hover:scale-[1.03] hover:brightness-110">
                    Enter as Guest
                  </Link>
                  <Link to="/signup" className="rounded-full border border-white/20 bg-white/75 px-6 py-2.5 text-sm font-bold text-green-900 shadow-sm transition duration-200 hover:scale-[1.03] hover:bg-white hover:brightness-105">
                    Sign Up
                  </Link>
                </div>
                <Link to="/membership" className="mt-3 inline-block text-sm font-semibold text-green-800 hover:underline">
                  Explore Membership
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-green-100 bg-white/90">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-4 py-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <div className="font-semibold text-green-900">Learnify</div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/membership" className="hover:text-green-700 hover:underline">Membership</Link>
            <Link to="/help-center" className="hover:text-green-700 hover:underline">Help Center</Link>
            <Link to="/honor-board" className="hover:text-green-700 hover:underline">Honor Board</Link>
          </div>
          <div>© {new Date().getFullYear()} Learnify</div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
