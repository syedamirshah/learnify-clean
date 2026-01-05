// src/pages/public/MembershipPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;
// If you already use a specific payments/choose URL, keep it consistent:
const PAYMENT_LINK = `${API}payments/choose/`;

const MembershipPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Top Navbar */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Learnify Pakistan"
              className="h-14 w-auto hover:opacity-90 transition"
              style={{ background: "transparent" }}
            />
            <div className="hidden sm:block">
              <div className="text-xl font-extrabold text-green-900 leading-tight">
                Learnify Pakistan
              </div>
              <div className="text-sm text-green-800/80 italic">
                Learning with Responsibility
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
            >
              Home
            </Link>

            <a
              href={PAYMENT_LINK}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              Choose Plan
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                Membership
                <span className="text-green-700/60">•</span>
                Grades 1–5
              </div>

              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-green-950 leading-tight">
                Learnify Membership
              </h1>

              <p className="mt-4 text-lg text-gray-700 leading-relaxed">
                Membership is not just payment — it is a learning relationship
                between Learnify and the learner. It gives students structured
                quizzes, instant feedback, progress tracking, and motivation
                through honors and medals — in a safe and responsible way.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={PAYMENT_LINK}
                  className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm"
                >
                  Start Membership
                </a>
                <Link
                  to="/signup"
                  className="px-5 py-3 rounded-xl bg-white border hover:bg-gray-50 text-gray-900 font-bold shadow-sm"
                >
                  Create Account
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <Badge text="Instant feedback after quizzes" />
                <Badge text="Honors & medals for motivation" />
                <Badge text="Subject & grade performance tracking" />
                <Badge text="Child-safe, privacy-first design" />
              </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm p-6 md:p-8">
              <div className="text-sm font-semibold text-green-800">
                What you’ll get
              </div>
              <div className="mt-3 space-y-3">
                <Bullet title="Learning & Assessment">
                  Quizzes (Single Choice / Multiple Choice / Fill-in-blank), one-question flow, and meaningful results.
                </Bullet>
                <Bullet title="Performance Tracking">
                  Subject-level insights + grade-level progress overview.
                </Bullet>
                <Bullet title="Honors & Recognition">
                  Recognition of Hardwork and Dedication - Shining Stars and National Heroes.
                </Bullet>
                <Bullet title="Responsible Experience">
                  No ads inside quizzes. No humiliation ranking. Privacy protected.
                </Bullet>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="font-bold text-green-900">Good to know</div>
                <div className="text-sm text-green-900/80 mt-1">
                  Visitors can try first 3 questions of any quiz to get the experience and know the quality of content.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <SectionTitle
          title="Who is Learnify Membership for?"
          subtitle="Clear, simple, and aligned with how your platform already works."
        />

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <Card title="Students (Grades 1–5)">
            Curriculum-aligned quizzes, instant feedback, progress tracking, and
            motivation through honors and recognition.
          </Card>

          <Card title="Teachers">
            Access student assessment views and performance records within your
            school/city setup.
          </Card>

          <Card title="Parents (Support role)">
            Support the child’s learning and monitor progress (features can expand
            later — membership is already parent-friendly).
          </Card>
        </div>
      </section>

      {/* What membership includes */}
      <section className="bg-gray-50 border-t border-b">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          <SectionTitle
            title="What does membership include?"
            subtitle="The core benefits that make Learnify meaningful — not just a quiz website."
          />

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <InfoCard
              title="A) Learning & Assessment"
              items={[
                "Grade-wise quizzes (SCQ, MCQ, FIB)",
                "One-question-at-a-time flow (kid-friendly)",
                "Instant feedback at the end of each quiz",
                "Structured attempts and results",
              ]}
            />

            <InfoCard
              title="B) Performance Tracking"
              items={[
                "Subject-level performance overview",
                "Grade-level progress view",
                "Quiz history and attempt insights",
                "Designed for improvement tracking",
              ]}
            />

            <InfoCard
              title="C) Honors & Recognition"
              items={[
                "Shining Stars and National Heroes",
                "Medals (Gold / Silver / Bronze)",
                "Honor Board display (positive recognition)",
                "Motivation without humiliation",
              ]}
            />

            <InfoCard
              title="D) Safety & Responsible Design"
              items={[
                "Privacy-first approach",
                "No ads inside quizzes",
                "No harmful public ranking",
                "Ethical recognition and encouragement",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Plans & rules */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <SectionTitle
          title="Membership plans & access rules"
          subtitle="Simple, transparent, and aligned with your existing subscription logic."
        />

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <div className="text-xl font-extrabold text-gray-900">
              Plans available
            </div>
            <div className="mt-4 space-y-3 text-gray-700">
              <PlanRow title="Monthly Membership" desc="Best for trying Learnify." />
              <PlanRow
                title="Yearly Membership"
                desc="Recommended for consistent learning."
                highlight
              />
            </div>

            <div className="mt-6 flex gap-3 flex-wrap">
              <a
                href={PAYMENT_LINK}
                className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                Choose a Plan
              </a>
              <Link
                to="/my-profile"
                className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold"
              >
                View My Profile
              </Link>
            </div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <div className="text-xl font-extrabold text-gray-900">
              Rules & fairness
            </div>

            <ul className="mt-4 space-y-3 text-gray-700">
              <RuleItem
                title="Grade change may be limited"
                desc="To keep learning records consistent, grade change can be restricted (e.g., once per year)."
              />
              <RuleItem
                title="Unlimited quiz attempts"
                desc="Students can retake quizzes to improve learning."
              />
              <RuleItem
                title="Latest attempt counts"
                desc="Only the latest result is kept for clarity and simplicity."
              />
              <RuleItem
                title="Expiry & renewal"
                desc="Expired users are guided to renew. Extended inactivity may lead to account removal for privacy."
              />
            </ul>

            <div className="mt-4 text-sm text-gray-500">
              (Exact enforcement depends on backend settings.)
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-green-50 border-t">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          <SectionTitle
            title="Our commitment to safety & privacy"
            subtitle="Learnify is built for children — dignity and protection come first."
          />

          <div className="grid md:grid-cols-4 gap-4 mt-6">
            <MiniCard title="Privacy-first">
              Student data is treated as sensitive and protected.
            </MiniCard>
            <MiniCard title="No ads in quizzes">
              Children learn without distractions and manipulative content.
            </MiniCard>
            <MiniCard title="No humiliation ranking">
              Recognition is positive, not shaming.
            </MiniCard>
            <MiniCard title="Learning values">
              “Learning with Responsibility” is part of the product design.
            </MiniCard>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-extrabold text-green-950">
              Ready to begin?
            </div>
            <div className="text-gray-600 mt-1">
              Start with a plan that fits you — and grow with consistent practice.
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <a
              href={PAYMENT_LINK}
              className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              Start Membership
            </a>
            <Link
              to="/help-center"
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ---------- Small UI helpers (no external libs) ---------- */

const SectionTitle = ({ title, subtitle }) => (
  <div>
    <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
    <p className="mt-2 text-gray-600 max-w-3xl">{subtitle}</p>
  </div>
);

const Card = ({ title, children }) => (
  <div className="bg-white border rounded-2xl shadow-sm p-6">
    <div className="text-xl font-extrabold text-gray-900">{title}</div>
    <div className="mt-2 text-gray-700 leading-relaxed">{children}</div>
  </div>
);

const InfoCard = ({ title, items }) => (
  <div className="bg-white border rounded-2xl shadow-sm p-6">
    <div className="text-lg font-extrabold text-gray-900">{title}</div>
    <ul className="mt-3 space-y-2 text-gray-700">
      {items.map((t, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="mt-1.5 w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  </div>
);

const MiniCard = ({ title, children }) => (
  <div className="bg-white border rounded-2xl shadow-sm p-5">
    <div className="font-extrabold text-gray-900">{title}</div>
    <div className="mt-1 text-sm text-gray-700">{children}</div>
  </div>
);

const Badge = ({ text }) => (
  <div className="bg-white border rounded-xl px-3 py-2 text-gray-700 shadow-sm">
    {text}
  </div>
);

const Bullet = ({ title, children }) => (
  <div className="border rounded-xl p-4">
    <div className="font-extrabold text-gray-900">{title}</div>
    <div className="text-gray-700 mt-1">{children}</div>
  </div>
);

const PlanRow = ({ title, desc, highlight }) => (
  <div className={`p-4 rounded-xl border ${highlight ? "bg-green-50 border-green-200" : "bg-white"}`}>
    <div className="flex items-center justify-between gap-3">
      <div className="font-extrabold text-gray-900">{title}</div>
      {highlight && (
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-200 text-green-900">
          Recommended
        </span>
      )}
    </div>
    <div className="text-sm text-gray-700 mt-1">{desc}</div>
  </div>
);

const RuleItem = ({ title, desc }) => (
  <li className="border rounded-xl p-4 bg-gray-50">
    <div className="font-extrabold text-gray-900">{title}</div>
    <div className="text-sm text-gray-700 mt-1">{desc}</div>
  </li>
);

export default MembershipPage;