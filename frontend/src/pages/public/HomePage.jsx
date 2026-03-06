import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white font-[Nunito] text-gray-900">
      <header className="border-b border-green-100">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Learnify" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-2xl font-extrabold text-green-900">Learnify</h1>
              <p className="text-sm text-green-700">Learning Math Responsibly</p>
            </div>
          </div>

          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link to="/login" className="text-green-800 hover:underline">Login</Link>
            <Link to="/signup" className="rounded-full border border-green-300 px-4 py-1.5 text-green-800 hover:bg-green-50">
              Sign Up
            </Link>
            <Link to="/learn" className="rounded-full bg-green-600 px-4 py-1.5 text-white hover:bg-green-700">
              Enter as Guest
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-[1200px] px-4 py-14 text-center">
          <h2 className="text-4xl font-extrabold text-green-900 sm:text-5xl">Master Math with Confidence</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-700">
            Textbook exercises, topic practice, and weekly plans in one structured platform.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
        </section>

        <section className="mx-auto mb-14 w-full max-w-[1200px] px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold text-green-900">Textbook Exercises</h3>
              <p className="mt-2 text-sm text-gray-600">Practice chapter-wise textbook exercises in structured order.</p>
              <Link to="/learn" className="mt-4 inline-block text-sm font-semibold text-green-700 hover:underline">Open</Link>
            </article>
            <article className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold text-green-900">Topic Practice</h3>
              <p className="mt-2 text-sm text-gray-600">Browse and practice quizzes grouped by topic index.</p>
              <Link to="/topic-index" className="mt-4 inline-block text-sm font-semibold text-green-700 hover:underline">Open</Link>
            </article>
            <article className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold text-green-900">Weekly Plan</h3>
              <p className="mt-2 text-sm text-gray-600">Follow weekly quiz plans for consistent progress.</p>
              <Link to="/weekly-plan" className="mt-4 inline-block text-sm font-semibold text-green-700 hover:underline">Open</Link>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
