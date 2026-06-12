import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import resultsTable from "@/assets/screenshots/results-table.png";
import teacherTasks from "@/assets/screenshots/teacher-tasks.png";
import quizAttempt from "@/assets/screenshots/quiz-attempt.png";
import weeklyPlan from "@/assets/screenshots/weekly-plan.png";

const SCHOOL_TEMPLATE_URL = "/student_bulk_upload_template.xlsx";

const PRICING_PLANS = [
  {
    name: "Small School",
    students: "Up to 200 students",
    monthly: "PKR 2,000",
    yearly: "PKR 18,000",
    highlight: false,
  },
  {
    name: "Medium School",
    students: "201–500 students",
    monthly: "PKR 5,000",
    yearly: "PKR 45,000",
    highlight: true,
  },
  {
    name: "Enterprise",
    students: "Unlimited students",
    monthly: "PKR 10,000",
    yearly: "PKR 90,000",
    highlight: false,
  },
];

const FEATURES = [
  {
    title: "Student Learning Diagnosis",
    description: "AI-style insights into strengths, weak chapters, and recommended practice for every learner.",
    icon: "🧠",
  },
  {
    title: "Teacher Analytics",
    description: "Monitor classroom performance and support teachers with actionable student data.",
    icon: "👩‍🏫",
  },
  {
    title: "School Dashboard",
    description: "A central command center for enrollment, onboarding, and school-wide performance.",
    icon: "🏫",
  },
  {
    title: "Task Monitoring",
    description: "Track assigned work, completion rates, and pending items across grades.",
    icon: "📋",
  },
  {
    title: "Honor Board",
    description: "Celebrate top performers and motivate students with transparent achievement recognition.",
    icon: "🏆",
  },
  {
    title: "Roster Upload",
    description: "Import teachers and students in bulk using a simple Excel template.",
    icon: "📥",
  },
];

const STEPS = [
  { number: "1", title: "Create School Account", detail: "Register your school and set up your admin profile." },
  { number: "2", title: "Choose Plan", detail: "Select the plan that fits your student capacity and budget." },
  { number: "3", title: "Upload Teachers & Students", detail: "Use the roster template to onboard your community quickly." },
  { number: "4", title: "Start Learning", detail: "Teachers assign work, students practice, and leaders monitor progress." },
];

const SCREENSHOTS = [
  { title: "School Dashboard", image: resultsTable, alt: "School dashboard overview" },
  { title: "Teacher Analytics", image: teacherTasks, alt: "Teacher analytics view" },
  { title: "Learning Diagnosis", image: quizAttempt, alt: "Student learning diagnosis" },
  { title: "Task Monitoring", image: weeklyPlan, alt: "Task monitoring overview" },
];

const FAQ_ITEMS = [
  {
    question: "Who can use Learnify?",
    answer:
      "Learnify is designed for students, teachers, and school leaders. Schools receive a dedicated admin dashboard for monitoring and onboarding.",
  },
  {
    question: "How are teachers added?",
    answer:
      "School admins upload teachers through the roster Excel template or add them during bulk onboarding. Teachers then access their classroom tools after activation.",
  },
  {
    question: "Can existing students be imported?",
    answer:
      "Yes. Download the official template, fill in student details, and upload the roster. Existing usernames are skipped automatically.",
  },
  {
    question: "Is annual pricing discounted?",
    answer:
      "Yes. Annual school plans include a 25% discount compared to paying monthly for the full year.",
  },
  {
    question: "How does onboarding work?",
    answer:
      "Create your school account, choose a plan, upload your roster, and start learning. Our team can assist with activation and setup when needed.",
  },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-3xl border border-emerald-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-bold text-emerald-950 sm:text-base">{question}</span>
        <span className="text-xl font-bold text-emerald-700">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="border-t border-emerald-100 px-5 pb-4 pt-3 text-sm leading-7 text-gray-700">
          {answer}
        </div>
      ) : null}
    </article>
  );
}

export default function SchoolOnboarding() {
  return (
    <div
      className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 text-gray-900"
      style={{
        fontFamily: '"Plus Jakarta Sans", Inter, Nunito, system-ui, -apple-system, sans-serif',
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute top-32 -right-28 h-72 w-72 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-lime-200/35 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-emerald-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 py-3 md:py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Learnify Pakistan Logo" className="h-12 w-auto object-contain sm:h-16" />
            <div className="hidden sm:block">
              <p className="text-lg font-extrabold text-emerald-950">Learnify Pakistan</p>
              <p className="text-xs font-semibold italic text-emerald-700">Practicing Math Responsibly</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
            >
              Home
            </Link>
            <a
              href={SCHOOL_TEMPLATE_URL}
              download
              className="hidden rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 sm:inline-flex"
            >
              Download Template
            </a>
            <Link
              to="/school-signup"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
            >
              School Signup
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="border-b border-emerald-100/70">
          <div className="mx-auto max-w-[1240px] px-4 py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                School Onboarding
              </p>
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-emerald-950 sm:text-5xl">
                Bring AI-Powered Learning Analytics to Your School
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-gray-700 sm:text-lg">
                Monitor student progress, support teachers, identify learning gaps, and celebrate
                achievement from a single dashboard.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/school-signup"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                >
                  School Signup
                </Link>
                <a
                  href={SCHOOL_TEMPLATE_URL}
                  download
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-300 bg-white px-6 py-3.5 text-sm font-extrabold text-emerald-900 shadow-sm transition hover:bg-emerald-50 sm:w-auto"
                >
                  Download Template
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-emerald-100/70 bg-white/50 py-12 sm:py-16">
          <div className="mx-auto max-w-[1240px] px-4">
            <div className="text-center">
              <h2 className="text-3xl font-black text-emerald-950">School Pricing</h2>
              <p className="mt-3 text-sm text-gray-600 sm:text-base">
                Flexible plans for every school size.{" "}
                <span className="font-bold text-emerald-800">25% discount on annual plans.</span>
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {PRICING_PLANS.map((plan) => (
                <article
                  key={plan.name}
                  className={`rounded-3xl border p-6 shadow-lg ${
                    plan.highlight
                      ? "border-emerald-500 bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-emerald-600/20 ring-2 ring-emerald-300"
                      : "border-emerald-200 bg-white shadow-emerald-900/5"
                  }`}
                >
                  {plan.highlight ? (
                    <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                      Most Popular
                    </span>
                  ) : null}
                  <h3
                    className={`mt-3 text-xl font-black ${
                      plan.highlight ? "text-white" : "text-emerald-950"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p className={`mt-2 text-sm ${plan.highlight ? "text-emerald-50" : "text-gray-600"}`}>
                    {plan.students}
                  </p>
                  <div className="mt-6 space-y-2">
                    <p className={`text-2xl font-black ${plan.highlight ? "text-white" : "text-emerald-950"}`}>
                      {plan.monthly}
                      <span className="text-sm font-semibold opacity-80"> /month</span>
                    </p>
                    <p className={`text-lg font-bold ${plan.highlight ? "text-emerald-50" : "text-emerald-800"}`}>
                      {plan.yearly}
                      <span className="text-sm font-semibold opacity-80"> /year</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-emerald-100/70 py-12 sm:py-16">
          <div className="mx-auto max-w-[1240px] px-4">
            <div className="text-center">
              <h2 className="text-3xl font-black text-emerald-950">Built for School Leaders</h2>
              <p className="mt-3 text-sm text-gray-600 sm:text-base">
                Everything you need to monitor learning, support teachers, and scale responsibly.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-black text-emerald-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-700">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-emerald-100/70 bg-white/50 py-12 sm:py-16">
          <div className="mx-auto max-w-[1240px] px-4">
            <div className="text-center">
              <h2 className="text-3xl font-black text-emerald-950">How It Works</h2>
              <p className="mt-3 text-sm text-gray-600 sm:text-base">
                A simple onboarding journey from signup to active learning.
              </p>
            </div>
            <div className="mx-auto mt-10 max-w-3xl space-y-4">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.number}>
                  <article className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                      {step.number}
                    </div>
                    <h3 className="mt-4 text-lg font-black text-emerald-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-gray-700">{step.detail}</p>
                  </article>
                  {index < STEPS.length - 1 ? (
                    <div aria-hidden="true" className="text-center text-2xl font-black text-emerald-400">
                      ↓
                    </div>
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-emerald-100/70 py-12 sm:py-16">
          <div className="mx-auto max-w-[1240px] px-4">
            <div className="text-center">
              <h2 className="text-3xl font-black text-emerald-950">See Learnify in Action</h2>
              <p className="mt-3 text-sm text-gray-600 sm:text-base">
                Preview the dashboards and tools your school will use every day.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {SCREENSHOTS.map((shot) => (
                <article
                  key={shot.title}
                  className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-md"
                >
                  <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
                    <h3 className="text-lg font-black text-emerald-950">{shot.title}</h3>
                  </div>
                  <img
                    src={shot.image}
                    alt={shot.alt}
                    className="h-56 w-full object-cover object-top sm:h-64"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-[900px] px-4">
            <div className="text-center">
              <h2 className="text-3xl font-black text-emerald-950">Frequently Asked Questions</h2>
              <p className="mt-3 text-sm text-gray-600 sm:text-base">
                Quick answers for principals, coordinators, and school admins.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-emerald-100 bg-gradient-to-r from-emerald-600 to-green-600 py-12 text-white">
          <div className="mx-auto max-w-[900px] px-4 text-center">
            <h2 className="text-3xl font-black">Ready to bring Learnify to your school?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base">
              School signup is opening soon. Download the roster template today and prepare your
              onboarding file in advance.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/school-signup"
                className="inline-flex rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-emerald-800"
              >
                School Signup
              </Link>
              <a
                href={SCHOOL_TEMPLATE_URL}
                download
                className="inline-flex rounded-2xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-extrabold text-white backdrop-blur-sm"
              >
                Download Template
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
