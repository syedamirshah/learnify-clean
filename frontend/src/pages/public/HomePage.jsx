import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import textbookExercises from "@/assets/screenshots/textbook-exercises.png";
import topicIndex from "@/assets/screenshots/topic-index.png";
import weeklyPlan from "@/assets/screenshots/weekly-plan.png";
import quizAttempt from "@/assets/screenshots/quiz-attempt.png";
import resultsTable from "@/assets/screenshots/results-table.png";
import honorBoard from "@/assets/screenshots/honor-board.png";
import membership from "@/assets/screenshots/membership.png";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white font-[Nunito] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-green-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Learnify" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-2xl font-extrabold text-green-900">Learnify</h1>
              <p className="text-sm text-green-700">Learning Math Responsibly</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3 text-sm font-semibold">
            <Link to="/login" className="rounded-full px-3 py-1.5 text-green-900 hover:bg-green-50">
              Login
            </Link>
            <Link to="/signup" className="rounded-full border border-green-300 px-4 py-1.5 text-green-900 hover:bg-green-50">
              Sign Up
            </Link>
            <Link to="/learn" className="rounded-full bg-green-600 px-4 py-1.5 text-white hover:bg-green-700">
              Enter as Guest
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
              Math Learning Platform
            </p>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight text-green-900 sm:text-5xl">
              Master Math with Confidence
            </h2>
            <p className="mt-4 max-w-xl text-lg text-gray-700">
              Build strong understanding through structured textbook exercises, focused topic practice,
              and guided weekly plans in one platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/learn" className="rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700">
                Start Learning
              </Link>
              <Link to="/signup" className="rounded-full border border-green-300 px-6 py-3 text-sm font-bold text-green-900 hover:bg-green-50">
                Sign Up
              </Link>
              <Link to="/learn" className="rounded-full border border-gray-300 px-6 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50">
                Enter as Guest
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-green-700">Textbook Exercises Preview</div>
            <img
              src={textbookExercises}
              alt="Textbook exercises preview"
              className="rounded-xl shadow-xl border border-gray-200 w-full"
            />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-4 py-8">
          <div className="mb-6 text-center">
            <h3 className="text-3xl font-extrabold text-green-900">Why Learnify Works</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Curriculum-Aligned Math Practice", "Practice aligned exercises organized for consistent progression."],
              ["Topic-Based Mastery", "Strengthen specific skills through focused topic practice paths."],
              ["Weekly Structured Learning", "Follow weekly plans to build routine and momentum."],
              ["Progress and Recognition", "Track outcomes and celebrate milestones with confidence."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                <h4 className="text-lg font-bold text-green-900">{title}</h4>
                <p className="mt-2 text-sm text-gray-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-4 py-10">
          <div className="mb-6 text-center">
            <h3 className="text-3xl font-extrabold text-green-900">Learn in Three Ways</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                title: "Textbook Exercises",
                desc: "Study chapter-wise exercises in textbook sequence.",
                to: "/learn",
                image: textbookExercises,
                button: "Open Exercises",
              },
              {
                title: "Topic Practice",
                desc: "Practice by topic to strengthen targeted skills.",
                to: "/topic-index",
                image: topicIndex,
                button: "Open Topics",
              },
              {
                title: "Weekly Plan",
                desc: "Follow structured weekly sets for steady progress.",
                to: "/weekly-plan",
                image: weeklyPlan,
                button: "Open Weekly Plan",
              },
            ].map((card) => (
              <article key={card.title} className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                <img
                  src={card.image}
                  alt={`${card.title} preview`}
                  className="rounded-xl shadow-xl border border-gray-200 w-full"
                />
                <h4 className="mt-4 text-xl font-bold text-green-900">{card.title}</h4>
                <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
                <Link to={card.to} className="mt-4 inline-block rounded-full border border-green-300 px-4 py-2 text-sm font-bold text-green-900 hover:bg-green-50">
                  {card.button}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-4 py-8">
          <div className="mb-6 text-center">
            <h3 className="text-3xl font-extrabold text-green-900">Built for Students, Teachers, and Families</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <h4 className="text-xl font-bold text-green-900">Students</h4>
              <p className="mt-2 text-sm text-gray-600">Build confidence through structured, grade-aligned math practice.</p>
            </article>
            <article className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <h4 className="text-xl font-bold text-green-900">Teachers</h4>
              <p className="mt-2 text-sm text-gray-600">Use a clear practice structure to guide students with consistency.</p>
            </article>
            <article className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <h4 className="text-xl font-bold text-green-900">Families</h4>
              <p className="mt-2 text-sm text-gray-600">Support daily math progress with one focused and simple platform.</p>
            </article>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-4 py-10">
          <div className="mb-6 text-center">
            <h3 className="text-3xl font-extrabold text-green-900">Results and Recognition</h3>
            <p className="mt-2 text-sm text-gray-700">
              Track performance clearly and celebrate achievement with visible milestones.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
              <img
                src={quizAttempt}
                alt="Quiz experience"
                className="rounded-xl shadow-xl border border-gray-200 w-full"
              />
              <h4 className="mt-3 text-lg font-bold text-green-900">Real Quiz Experience</h4>
            </article>
            <article className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
              <img
                src={resultsTable}
                alt="Progress results"
                className="rounded-xl shadow-xl border border-gray-200 w-full"
              />
              <h4 className="mt-3 text-lg font-bold text-green-900">Progress Tracking</h4>
            </article>
            <article className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
              <img
                src={honorBoard}
                alt="Honor board preview"
                className="rounded-xl shadow-xl border border-gray-200 w-full"
              />
              <h4 className="mt-3 text-lg font-bold text-green-900">Honor Board Recognition</h4>
              <Link to="/honor-board" className="mt-2 inline-block text-sm font-bold text-green-800 hover:underline">
                View Honor Board
              </Link>
            </article>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-4 pb-14 pt-2">
          <div className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm md:p-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
              <img
                src={membership}
                alt="Membership plans"
                className="rounded-xl shadow-xl border border-gray-200 w-full"
              />
              <div>
                <h3 className="text-3xl font-extrabold text-green-900">Ready to Start Learning?</h3>
                <p className="mt-3 text-sm text-gray-700">
                  Enter instantly as a guest, or create your account to unlock your full learning journey.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to="/learn" className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700">
                    Enter as Guest
                  </Link>
                  <Link to="/signup" className="rounded-full border border-green-300 px-6 py-2.5 text-sm font-bold text-green-900 hover:bg-green-100">
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

      <footer className="border-t border-green-100 bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-4 py-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
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
