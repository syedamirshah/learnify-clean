// src/pages/public/MembershipPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;
// If you already use a specific payments/choose URL, keep it consistent:
const PAYMENT_LINK = `${API}payments/choose/`;
const SCHOOL_TEMPLATE_URL = "/student_bulk_upload_template.xlsx";

const MembershipPage = () => {
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // Pricing (as per your decision)
  const MONTHLY_INDIVIDUAL = 200; // Rs.
  const YEARLY_BASE = MONTHLY_INDIVIDUAL * 12; // 2400
  const YEARLY_INDIVIDUAL = Math.round(YEARLY_BASE * 0.75); // 25% off => 1800

  // Schools discount rules (as requested)
  const SCHOOL_MONTHLY_PER_STUDENT = Math.round(MONTHLY_INDIVIDUAL * 0.75); // 25% off => 150
  const SCHOOL_YEARLY_PER_STUDENT = Math.round(YEARLY_BASE * 0.5); // Annual + school => 50% off => 1200

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
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-6 md:py-8">
        <h1 className="text-3xl font-extrabold text-green-950 md:text-4xl">Membership</h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">Choose a plan that fits you.</p>
      </section>

      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                Membership
                <span className="text-green-700/60">•</span>
                Grades 1–5
              </div>

              <h2 className="mt-4 text-2xl sm:text-3xl md:text-5xl font-extrabold text-green-950 leading-tight">
                Learnify Membership
              </h2>

              <p className="mt-4 text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
                Membership is not just a payment — it’s a learning partnership.
                Students get structured practice, instant feedback, and clear progress
                tracking, supported by positive recognition in a safe and responsible way.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <a
                  href={PAYMENT_LINK}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                >
                  Start Membership
                </a>
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border hover:bg-gray-50 text-gray-900 font-bold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                >
                  Create Account
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <Badge text="Instant feedback after quizzes" />
                <Badge text="Shining Stars & National Heroes" />
                <Badge text="Subject & grade progress tracking" />
                <Badge text="Child-safe, privacy-first design" />
              </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm p-6 md:p-8">
              <div className="text-sm font-semibold text-green-800">
                What you’ll get
              </div>
              <div className="mt-3 space-y-3">
                <Bullet title="Learning & Assessment">
                  Exercises (Single Choice / Multiple Choice / Fill-in-the-Blank), a simple one-question flow,
                  and meaningful results.
                </Bullet>
                <Bullet title="Performance Tracking">
                  Subject-level insights + grade-level progress overview.
                </Bullet>
                <Bullet title="Honors & Recognition">
                  Positive recognition through Shining Stars and National Heroes — motivation without shame.
                </Bullet>
                <Bullet title="Responsible Experience">
                  No ads inside quizzes. No public humiliation ranking. Privacy protected.
                </Bullet>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="font-bold text-green-900">Good to know</div>
                <div className="text-sm text-green-900/80 mt-1">
                  Visitors can try the first 3 questions of any quiz to experience the quality of content.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-12">
        <SectionTitle
          title="Who is Learnify Membership for?"
          subtitle="Clear, simple learning aligned with officially approved textbooks of Pakistan."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <Card title="Students (Grades 1–5)">
            Curriculum-aligned exercises, instant feedback, progress tracking,
            and motivation through Shining Stars and National Heroes.
          </Card>

          <Card title="Teachers">
            Teachers can view student progress within the school/city setup,
            assign practice exercises, and track learning outcomes — so class support becomes easier and smarter.
          </Card>

          <Card title="Parents (Support role)">
            A practical alternative to private tutoring: learning happens inside a safe home environment,
            parents can follow the child’s learning outcomes clearly, and the cost stays affordable.
          </Card>

          <Card title="Schools">
            Schools get an organized learning system for grades 1–5 with discounted plans.
            Learnify also helps schools set up accounts quickly using a simple template for student and teacher names.
          </Card>
        </div>
      </section>

      {/* What membership includes */}
      <section className="bg-gray-50 border-t border-b">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-12">
          <SectionTitle
            title="What does membership include?"
            subtitle="The core benefits that make Learnify meaningful — not just a quiz website."
          />

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <InfoCard
              title="A) Learning & Assessment"
              items={[
                "Grade-wise exercises (SCQ, MCQ, FIB)",
                "One-question-at-a-time flow (kid-friendly)",
                "Instant feedback at the end of each quiz",
                "Structured attempts and clear results",
                "Teachers can assign exercises to guide practice",
              ]}
            />

            <InfoCard
              title="B) Performance Tracking"
              items={[
                "Subject-level performance overview",
                "Grade-level progress view",
                "Quiz history and attempt insights",
                "Tracking designed for real improvement",
              ]}
            />

            <InfoCard
              title="C) Honors & Recognition"
              items={[
                "Shining Stars and National Heroes",
                "Honor Board display (positive recognition)",
                "Motivation with dignity and encouragement",
              ]}
            />

            <InfoCard
              title="D) Safety & Responsible Design"
              items={[
                "Privacy-first approach",
                "No ads inside quizzes",
                "No harmful public ranking",
                "Ethical recognition and child-safe experience",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Plans & rules */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-12">
        <SectionTitle
          title="Membership plans & access rules"
          subtitle="Simple, transparent pricing — aligned with Learnify’s subscription logic."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Plans */}
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <div className="text-xl font-extrabold text-gray-900">
              Plans available
            </div>

            <div className="mt-4 space-y-3 text-gray-700">
              <PlanRow
                title={`Monthly (Individual) — Rs. ${MONTHLY_INDIVIDUAL}`}
                desc="Best for starting and trying Learnify regularly."
              />
              <PlanRow
                title={`Yearly (Individual) — Rs. ${YEARLY_INDIVIDUAL}`}
                desc={`Full year access with 25% discount (base Rs. ${YEARLY_BASE}).`}
                highlight
              />
            </div>

            <div className="mt-6 border-t pt-5">
              <div className="text-lg font-extrabold text-gray-900">
                School discounts (100+ students)
              </div>
              <div className="mt-3 space-y-3 text-gray-700">
                <PlanRow
                  title={`Monthly (School) — Rs. ${SCHOOL_MONTHLY_PER_STUDENT} per student`}
                  desc="25% discount for schools with more than 100 students."
                />
                <PlanRow
                  title={`Yearly (School) — Rs. ${SCHOOL_YEARLY_PER_STUDENT} per student`}
                  desc={`Annual + school status gives 50% discount (base Rs. ${YEARLY_BASE}).`}
                  highlight
                />
              </div>

              <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="font-bold text-green-900">School onboarding support</div>
                <div className="text-sm text-green-900/80 mt-1 space-y-1">
                  <p>
                    Learnify helps schools create accounts smoothly. Schools only need to provide
                    teachers’ and students’ names in a simple Excel template — we organize the setup.
                  </p>
                  <p>
                    📎{" "}
                    <a
                      href={SCHOOL_TEMPLATE_URL}
                      download
                      className="font-semibold text-green-800 underline hover:text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                    >
                      Download student upload template
                    </a>{" "}
                    and email the completed sheet to{" "}
                    <a
                      href="mailto:support@learnifypakistan.com"
                      className="font-semibold underline hover:text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                    >
                      support@learnifypakistan.com
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <a
                href={PAYMENT_LINK}
                className="w-full md:w-auto px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              >
                Choose a Plan
              </a>
              <Link
                to="/my-profile"
                className="w-full md:w-auto px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              >
                View My Profile
              </Link>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <div className="text-xl font-extrabold text-gray-900">
              Rules & fairness
            </div>

            <ul className="mt-4 space-y-3 text-gray-700">
              <RuleItem
                title="Grade change may be limited"
                desc="To keep learning records consistent, grade change can be restricted (for example, once per year)."
              />
              <RuleItem
                title="Unlimited practice attempts"
                desc="Students can retake quizzes as many times as needed for learning."
              />
              <RuleItem
                title="Latest attempt counts"
                desc="For clarity and simplicity, the system keeps the latest result as the official record."
              />
              <RuleItem
                title="Fresh questions in practice"
                desc="Practice is designed to stay useful — each attempt can bring new questions instead of repeating the same ones."
              />
              <RuleItem
                title="Expiry & renewal"
                desc="Expired users are guided to renew. Extended inactivity may lead to account removal for privacy."
              />
            </ul>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-green-50 border-t">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-12">
          <SectionTitle
            title="Our commitment to safety & privacy"
            subtitle="Learnify is built for children — dignity and protection come first."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
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
            <MiniCard title="Research with care">
              Anonymous learning trends can support research on outcomes across regions,
              school types, language, gender, and more — without exposing identities.
            </MiniCard>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-white border-t">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-extrabold text-green-950">
              Ready to begin?
            </div>
            <div className="text-gray-600 mt-1">
              Start with a plan that fits you — and grow with consistent practice.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 w-full md:w-auto">
            <a
              href={PAYMENT_LINK}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
            >
              Start Membership
            </a>
            <Link
              to="/help-center"
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </footer>
      </div>
    </AppLayout>
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
  <div
    className={`p-4 rounded-xl border ${
      highlight ? "bg-green-50 border-green-200" : "bg-white"
    }`}
  >
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
