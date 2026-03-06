import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

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

          <div className="rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-green-700">Textbook Exercises Preview</div>
            <div className="flex h-[320px] items-center justify-center rounded-2xl border-2 border-dashed border-green-200 bg-white text-center">
              <div>
                <p className="text-base font-bold text-green-900">Screenshot Placeholder</p>
                <p className="mt-1 text-sm text-gray-600">Chapter-wise exercises and progress cards</p>
              </div>
            </div>
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
            <h3 className="text-3xl font-extrabold text-green-900">Choose How You Want to Study</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                title: "Textbook Exercises",
                desc: "Study chapter-wise exercises in textbook sequence.",
                to: "/learn",
              },
              {
                title: "Topic Practice",
                desc: "Practice by topic to strengthen targeted skills.",
                to: "/topic-index",
              },
              {
                title: "Weekly Plan",
                desc: "Follow structured weekly sets for steady progress.",
                to: "/weekly-plan",
              },
            ].map((card) => (
              <article key={card.title} className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-36 items-center justify-center rounded-xl border-2 border-dashed border-green-200 bg-green-50/40 text-sm font-semibold text-green-700">
                  Thumbnail Placeholder
                </div>
                <h4 className="text-xl font-bold text-green-900">{card.title}</h4>
                <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
                <Link to={card.to} className="mt-4 inline-block text-sm font-bold text-green-700 hover:underline">
                  Open
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-4 py-8">
          <div className="mb-6 text-center">
            <h3 className="text-3xl font-extrabold text-green-900">Access Learnify Your Way</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <h4 className="text-xl font-bold text-green-900">Guest</h4>
              <p className="mt-2 text-sm text-gray-600">Explore quizzes across grades in preview mode.</p>
            </article>
            <article className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <h4 className="text-xl font-bold text-green-900">Teacher</h4>
              <p className="mt-2 text-sm text-gray-600">Browse and preview quizzes across grades with ease.</p>
            </article>
            <article className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <h4 className="text-xl font-bold text-green-900">Student</h4>
              <p className="mt-2 text-sm text-gray-600">Get full graded access for your own grade learning path.</p>
            </article>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-4 py-10">
          <div className="rounded-3xl border border-green-100 bg-gradient-to-r from-green-50 to-white p-6 shadow-sm md:p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div>
                <h3 className="text-3xl font-extrabold text-green-900">Honor Board</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Celebrate learners who consistently show commitment and achievement.
                </p>
                <Link to="/honor-board" className="mt-4 inline-block rounded-full border border-green-300 px-5 py-2 text-sm font-bold text-green-900 hover:bg-green-100">
                  View Honor Board
                </Link>
              </div>
              <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-green-200 bg-white text-sm font-semibold text-green-700">
                Honor Board Preview Placeholder
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-4 pb-14 pt-2">
          <div className="rounded-3xl border border-green-200 bg-green-50 p-6 text-center shadow-sm md:p-8">
            <h3 className="text-3xl font-extrabold text-green-900">Flexible Membership for Every Learner</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-700">
              Access structured math learning with affordable and practical membership options.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/membership" className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700">
                Explore Membership
              </Link>
              <Link to="/signup" className="rounded-full border border-green-300 px-6 py-2.5 text-sm font-bold text-green-900 hover:bg-green-100">
                Sign Up
              </Link>
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
