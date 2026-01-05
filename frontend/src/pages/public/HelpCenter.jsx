import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const HelpCenter = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const supportEmail = "support@learnifypakistan.com";

  const categories = useMemo(
    () => [
      {
        title: "For Students",
        items: [
          "How to attempt a quiz",
          "Retaking quizzes (practice again)",
          "Viewing your results and answers",
          "Understanding Shining Stars & National Heroes",
        ],
      },
      {
        title: "For Parents",
        items: [
          "Understanding your child’s progress",
          "Subscription plans and renewals",
          "Payment and fee receipt upload",
          "What happens when subscription expires",
        ],
      },
      {
        title: "For Teachers & Schools",
        items: [
          "Viewing students’ results",
          "How assessments work",
          "Common classroom use tips",
          "Account and profile updates",
        ],
      },
      {
        title: "Membership & Billing",
        items: [
          "What is included in membership",
          "Free attempt policy (first quiz as guest)",
          "Renewing an expired account",
          "Payment confirmation and processing",
        ],
      },
      {
        title: "Technical Help",
        items: [
          "Login issues",
          "Changing password",
          "Updating profile picture",
          "Basic troubleshooting (browser / internet)",
        ],
      },
    ],
    []
  );

  const faqs = useMemo(
    () => [
      {
        q: "Can I use Learnify Pakistan without subscription?",
        a: "Yes. Visitors can attempt the first quiz as a guest. From the second attempt onwards, you will be asked to join/subscribe.",
      },
      {
        q: "How do I attempt a quiz?",
        a: "Open the quiz and answer one question at a time. Your answers are saved during the attempt and your result appears after finishing the quiz.",
      },
      {
        q: "Can students retake quizzes?",
        a: "Yes. Students can retake quizzes for learning and practice. Learnify keeps your latest attempt result for reporting (as per current system settings).",
      },
      {
        q: "What do Shining Stars and National Heroes mean?",
        a: "These are honor categories based on total marks (not percentage). Students who attempt the most quizzes and achieve the highest total marks are recognized.",
      },
      {
        q: "Where can I see quiz results?",
        a: "After completing a quiz, students can view their result and see which answers were correct or incorrect. Teachers/Schools can view student results through their dashboard.",
      },
      {
        q: "My grade is not showing correctly. What should I do?",
        a: "First, refresh the page and re-login. If it still doesn’t show, go to Account Settings → Edit Profile and update your grade (if allowed). If the issue remains, contact support.",
      },
      {
        q: "Can I change my grade anytime?",
        a: "In Learnify Pakistan, grade changes may be restricted (for example, limited changes per year) to protect academic consistency. If you can’t change it, contact support for guidance.",
      },
      {
        q: "How does renewal work when subscription expires?",
        a: "If your account expires, you will be redirected to the renewal page after login. After you submit the renewal request (with fee receipt), you may be signed out and you can continue as guest until activation.",
      },
      {
        q: "How do I upload or change profile picture?",
        a: "Go to My Profile and use the edit button on your picture to upload a new one. If uploading fails, check your internet connection and try again.",
      },
      {
        q: "Can I remove my profile picture?",
        a: "If the current system doesn’t show a “Remove” button, it means removal is not enabled yet. You can replace it with another picture anytime, and we can add removal support if needed.",
      },
      {
        q: "I paid fee but my account is still inactive. Why?",
        a: "Payments are verified by the system/admin flow based on the uploaded fee receipt. If there is a delay, it may be under review. Please wait a little and contact support if needed.",
      },
      {
        q: "I forgot my password. What can I do?",
        a: "Use the Change Password option if you are logged in. If you are logged out and cannot access the account, contact support with your username and registered email.",
      },
    ],
    []
  );

  const toggleFAQ = (idx) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Top Bar */}
      <nav className="w-full bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Learnify Pakistan"
              className="h-14 w-auto hover:opacity-90 transition"
              style={{ background: "transparent" }}
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/membership"
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
            >
              Membership
            </Link>
            <Link
              to="/join"
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            >
              Join Learnify
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pt-10 pb-6">
        <div className="rounded-2xl border bg-green-50 p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-green-900">
            Help Center
          </h1>
          <p className="mt-2 text-gray-700 max-w-3xl">
            We’re here to help students, parents, and schools get the best learning
            experience from Learnify Pakistan — quizzes, results, membership, and
            account settings.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`mailto:${supportEmail}`}
              className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 transition"
            >
              Email Support
            </a>
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Quick Help Topics
        </h2>
        <p className="text-gray-600 mt-1">
          Choose a section below to quickly find answers.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-green-900">{cat.title}</div>
              <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc list-inside">
                {cat.items.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-600 mt-1">
          Click a question to view the answer.
        </p>

        <div className="mt-4 space-y-3">
          {faqs.map((f, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="rounded-2xl border bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleFAQ(idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                >
                  <span className="font-semibold text-gray-900">{f.q}</span>
                  <span className="text-green-800 font-bold">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-gray-700 text-sm leading-6">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Support */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="rounded-2xl border bg-gray-50 p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-900">Still need help?</h3>
          <p className="text-gray-700 mt-2 max-w-3xl">
            If your issue is not solved here, email our support team. Please include
            your <span className="font-semibold">username</span> and a short description
            (and screenshot if possible).
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${supportEmail}`}
              className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 transition"
            >
              {supportEmail}
            </a>
            <span className="text-sm text-gray-600">
              Response time: usually 24–48 hours on working days.
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Learnify Pakistan is an educational support platform. Quiz results and
          reports are designed to help learning and practice.
        </p>
      </section>
    </div>
  );
};

export default HelpCenter;