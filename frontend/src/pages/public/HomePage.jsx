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

  const featureCards = [
    {
      title: "Aligned with Curriculum",
      description:
        "Math practice follows a structured sequence so learners build understanding in the right order.",
    },
    {
      title: "Smart Pedagogy",
      description:
        "Learnify supports step-by-step concept building through clear practice paths and focused revision.",
    },
    {
      title: "Track Progress Clearly",
      description:
        "Students and teachers can follow performance, identify weak areas, and see improvement over time.",
    },
    {
      title: "Unlimited, Affordable Practice",
      description:
        "Meaningful math practice stays accessible, repeatable, and easy to continue.",
    },
  ];

  const learningModes = [
    {
      title: "Textbook Exercises",
      description: "Study chapter-wise exercises in a structured textbook sequence.",
      to: "/learn",
      image: textbookExercises,
      button: "Open Exercises",
    },
    {
      title: "Topic Practice",
      description: "Strengthen specific concepts through focused topic-based learning.",
      to: "/topic-index",
      image: topicIndex,
      button: "Open Topics",
    },
    {
      title: "Weekly Plan",
      description: "Follow a guided weekly path for regular and steady progress.",
      to: "/weekly-plan",
      image: weeklyPlan,
      button: "Open Weekly Plan",
    },
  ];

  const audienceCards = [
    {
      title: "Students",
      description:
        "Build confidence through regular practice, immediate feedback, and clear learning structure.",
    },
    {
      title: "Teachers",
      description:
        "Guide learners with a platform that supports consistency, preview access, and progress visibility.",
    },
    {
      title: "Families",
      description:
        "Support daily math learning with one focused, affordable, and easy-to-use platform.",
    },
  ];

  const sectionTitleClass =
    "text-3xl font-bold tracking-tight text-[#0f5132] sm:text-4xl";
  const sectionTextClass =
    "mt-3 max-w-2xl text-base leading-7 text-gray-600";

  const screenshotClass =
    "w-full rounded-xl border border-[#d9e9df] bg-white shadow-sm";

  return (
    <div
      className="min-h-screen bg-[#f7fbf8] text-gray-900"
      style={{
        fontFamily: '"Plus Jakarta Sans", Inter, Nunito, system-ui, -apple-system, sans-serif',
      }}
    >
      <header className="border-b border-[#dbe9df] bg-white">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Learnify"
            className="h-14 w-14 object-contain sm:h-16 sm:w-16"
          />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0f5132] sm:text-3xl">
              Learnify
            </h1>
            <p className="mt-1 text-sm font-medium text-[#118C4F] sm:text-base">
              Learning Math Responsibly
            </p>
          </div>
        </div>

          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            <a
              href="#login-card"
              className="rounded-md border border-[#118C4F] bg-white px-4 py-2 text-sm font-semibold text-[#118C4F] transition hover:bg-green-50"
            >
              Login
            </a>
            <Link
              to="/signup"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Sign Up
            </Link>
            <Link
              to="/learn"
              className="rounded-md bg-[#118C4F] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f7d47]"
            >
              Enter as Guest
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-[#e3efe7] bg-white">
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-10 px-4 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:py-16">
            <div>
              <p className="inline-flex rounded-full bg-[#eaf6ee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#118C4F]">
                Entry Page
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-[#0f5132] sm:text-5xl lg:text-6xl">
                Master Math with Confidence
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-700">
                Enter the platform to explore textbook exercises, topic practice,
                weekly learning plans, and clear progress tracking in one focused
                math environment.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {heroButtons.map((btn) =>
                  btn.isAnchor ? (
                    <a key={btn.label} href={btn.to} className={btn.className}>
                      {btn.label}
                    </a>
                  ) : (
                    <Link key={btn.label} to={btn.to} className={btn.className}>
                      {btn.label}
                    </Link>
                  )
                )}
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Try real exercises instantly — no signup required.
              </p>

              <div className="mt-10">
                <p className="mb-3 text-sm font-semibold text-[#118C4F]">
                  Textbook Exercises Preview
                </p>
                <img
                  src={textbookExercises}
                  alt="Textbook exercises preview"
                  className={screenshotClass}
                />
              </div>
            </div>

            <div
              id="login-card"
              className="rounded-2xl border border-[#dbe9df] bg-[#fcfefd] p-6 shadow-sm"
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
                className="mt-5 w-full rounded-lg bg-[#118C4F] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f7d47]"
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

        <section className="mx-auto w-full max-w-[1240px] px-4 py-14">
          <div className="max-w-3xl">
            <h3 className={sectionTitleClass}>Why Learnify Works</h3>
            <p className={sectionTextClass}>
              Learnify combines structured practice, focused revision, and clear progress
              visibility in one math-first platform.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-[#dbe9df] bg-white p-6 shadow-sm"
              >
                <h4 className="text-xl font-semibold text-[#0f5132]">{card.title}</h4>
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[#e3efe7] bg-white">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-14">
            <div className="max-w-3xl">
              <h3 className={sectionTitleClass}>Learn in Three Ways</h3>
              <p className={sectionTextClass}>
                Choose the style of practice that best fits your learning routine.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {learningModes.map((card) => (
                <article
                  key={card.title}
                  className="overflow-hidden rounded-2xl border border-[#dbe9df] bg-[#fcfefd] shadow-sm"
                >
                  <div className="border-b border-[#e3efe7] bg-white p-4">
                    <img
                      src={card.image}
                      alt={`${card.title} preview`}
                      className={screenshotClass}
                    />
                  </div>

                  <div className="p-5">
                    <h4 className="text-xl font-semibold text-[#0f5132]">{card.title}</h4>
                    <p className="mt-3 text-sm leading-7 text-gray-600">
                      {card.description}
                    </p>
                    <Link
                      to={card.to}
                      className="mt-5 inline-flex rounded-md border border-[#118C4F] bg-white px-4 py-2 text-sm font-semibold text-[#118C4F] transition hover:bg-green-50"
                    >
                      {card.button}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-4 py-14">
          <div className="max-w-3xl">
            <h3 className={sectionTitleClass}>Built for Students, Teachers, and Families</h3>
            <p className={sectionTextClass}>
              Learnify is designed to support regular math practice across different learning settings.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {audienceCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-[#dbe9df] bg-white p-6 shadow-sm"
              >
                <h4 className="text-xl font-semibold text-[#0f5132]">{card.title}</h4>
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[#e3efe7] bg-white">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-14">
            <div className="max-w-3xl">
              <h3 className={sectionTitleClass}>Results and Recognition</h3>
              <p className={sectionTextClass}>
                Learners can track performance clearly and stay motivated through visible achievement.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <article className="rounded-2xl border border-[#dbe9df] bg-[#fcfefd] p-4 shadow-sm">
                <img
                  src={quizAttempt}
                  alt="Quiz experience preview"
                  className={screenshotClass}
                />
                <h4 className="mt-4 text-lg font-semibold text-[#0f5132]">
                  Real Quiz Experience
                </h4>
              </article>

              <article className="rounded-2xl border border-[#dbe9df] bg-[#fcfefd] p-4 shadow-sm">
                <img
                  src={resultsTable}
                  alt="Progress results preview"
                  className={screenshotClass}
                />
                <h4 className="mt-4 text-lg font-semibold text-[#0f5132]">
                  Progress Tracking
                </h4>
              </article>

              <article className="rounded-2xl border border-[#dbe9df] bg-[#fcfefd] p-4 shadow-sm">
                <img
                  src={honorBoard}
                  alt="Honor board preview"
                  className={screenshotClass}
                />
                <h4 className="mt-4 text-lg font-semibold text-[#0f5132]">
                  Honor Board Recognition
                </h4>
                <Link
                  to="/honor-board"
                  className="mt-3 inline-flex text-sm font-semibold text-[#118C4F] hover:underline"
                >
                  View Honor Board
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-4 py-14">
          <div className="grid grid-cols-1 gap-8 rounded-2xl border border-[#dbe9df] bg-white p-6 shadow-sm lg:grid-cols-[1fr_1.05fr] lg:items-center lg:p-8">
            <img
              src={membership}
              alt="Membership plans"
              className={screenshotClass}
            />

            <div>
              <h3 className={sectionTitleClass}>Ready to Start Learning?</h3>
              <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
                Enter instantly as a guest, or create an account to continue your full learning journey.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/learn"
                  className="inline-flex items-center justify-center rounded-md bg-[#118C4F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f7d47]"
                >
                  Enter as Guest
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Sign Up
                </Link>
              </div>

              <Link
                to="/membership"
                className="mt-4 inline-flex text-sm font-semibold text-[#118C4F] hover:underline"
              >
                Explore Membership
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dbe9df] bg-white">
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