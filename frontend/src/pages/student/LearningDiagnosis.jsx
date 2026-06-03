import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import { buildPublicNavItems } from "../../utils/publicNav";

const QUIZ_ATTEMPT_ROUTE = (quizId) => `/student/attempt-quiz/${quizId}`;

const statusBadge = {
  strong: "bg-green-100 text-green-800 ring-green-200",
  improving: "bg-amber-100 text-amber-900 ring-amber-200",
  weak: "bg-red-100 text-red-800 ring-red-200",
};

const statusLabel = {
  strong: "Strong",
  improving: "Improving",
  weak: "Needs Practice",
};

const LearningDiagnosis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(
    localStorage.getItem("user_full_name") || ""
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get("student/learning-diagnosis/")
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setError("An active subscription is required to view Learning Diagnosis.");
        } else {
          setError("Failed to load learning diagnosis.");
        }
        setLoading(false);
      });
  }, []);

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

  const navItems = useMemo(() => buildPublicNavItems(role), [role]);

  const hasData = data?.has_data && (data?.overall?.total_attempted_quizzes || 0) > 0;

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Practicing Math Responsibly"
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
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] px-4 py-8 text-gray-800 md:px-6">
        <header className="mx-auto mb-6 max-w-[1100px]">
          <h2 className="text-2xl font-extrabold leading-tight text-green-900 md:text-3xl">
            Learning Diagnosis
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-700 md:text-base">
            Understand your strengths, weak areas, and recommended practice.
          </p>
        </header>

        <div className="mx-auto max-w-[1100px]">
          {loading ? (
            <div
              aria-live="polite"
              className="rounded-2xl border border-green-200 bg-white py-12 text-center font-semibold text-green-800"
            >
              Loading your learning diagnosis...
            </div>
          ) : error ? (
            <div
              aria-live="polite"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center font-semibold text-red-700"
            >
              {error}
            </div>
          ) : !hasData ? (
            <div className="rounded-2xl border-2 border-green-200 bg-white p-8 text-center shadow-sm">
              <p className="text-base font-semibold text-gray-800">
                You have not attempted enough quizzes yet. Start practicing to receive
                your learning diagnosis.
              </p>
              <Link
                to="/learn"
                className="mt-5 inline-flex rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700"
              >
                Start Practicing
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overall health cards */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {[
                  {
                    label: "Overall Average",
                    value: `${data.overall.overall_average_percentage}%`,
                  },
                  {
                    label: "Quizzes Attempted",
                    value: data.overall.total_attempted_quizzes,
                  },
                  {
                    label: "Strong Chapters",
                    value: data.overall.strong_chapters_count,
                  },
                  {
                    label: "Weak Chapters",
                    value: data.overall.weak_chapters_count,
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {card.label}
                    </div>
                    <div className="mt-2 text-2xl font-extrabold text-green-900">
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chapter mastery */}
              <section className="overflow-hidden rounded-2xl border-2 border-green-200 bg-white shadow-sm">
                <div className="border-b border-green-200 bg-green-50 px-5 py-4">
                  <h3 className="text-xl font-black text-green-900">Chapter Mastery</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Based on your latest result for each quiz.
                  </p>
                </div>
                <div className="p-5">
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-green-100 text-xs uppercase tracking-wide text-gray-500">
                          <th className="px-3 py-2">Chapter</th>
                          <th className="px-3 py-2">Subject</th>
                          <th className="px-3 py-2">Quizzes</th>
                          <th className="px-3 py-2">Average</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.chapter_mastery.map((ch) => (
                          <tr
                            key={`${ch.chapter_id}-${ch.chapter_name}`}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="px-3 py-3 font-semibold text-gray-900">
                              {ch.chapter_name}
                            </td>
                            <td className="px-3 py-3 text-gray-700">{ch.subject_name}</td>
                            <td className="px-3 py-3 text-gray-700">{ch.quizzes_attempted}</td>
                            <td className="px-3 py-3 font-semibold text-gray-900">
                              {ch.average_percentage}%
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusBadge[ch.status] || statusBadge.weak}`}
                              >
                                {statusLabel[ch.status] || ch.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {data.chapter_mastery.map((ch) => (
                      <div
                        key={`m-${ch.chapter_id}-${ch.chapter_name}`}
                        className="rounded-xl border border-green-100 bg-green-50/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-green-900">{ch.chapter_name}</div>
                            <div className="text-sm text-gray-600">{ch.subject_name}</div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusBadge[ch.status] || statusBadge.weak}`}
                          >
                            {statusLabel[ch.status]}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          {ch.quizzes_attempted} quiz(es) · {ch.average_percentage}% average
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Recommended practice */}
              <section className="overflow-hidden rounded-2xl border-2 border-green-200 bg-white shadow-sm">
                <div className="border-b border-green-200 bg-green-50 px-5 py-4">
                  <h3 className="text-xl font-black text-green-900">Recommended Practice</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Focus on weak chapters and low-score quizzes first.
                  </p>
                </div>
                <div className="divide-y divide-green-100 p-5">
                  {data.recommended_practice?.length ? (
                    data.recommended_practice.map((item) => (
                      <div
                        key={`rec-${item.quiz_id}-${item.reason}`}
                        className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900">{item.quiz_title}</div>
                          <div className="text-sm text-gray-600">
                            {item.subject_name}
                            {item.chapter_name ? ` · ${item.chapter_name}` : ""} ·{" "}
                            {item.percentage}%
                          </div>
                          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {item.reason === "weak_chapter"
                              ? "Weak chapter"
                              : "Low score quiz"}
                          </div>
                        </div>
                        <Link
                          to={item.practice_path || QUIZ_ATTEMPT_ROUTE(item.quiz_id)}
                          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700"
                        >
                          Practice Again
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">
                      Great work — no urgent practice recommendations right now.
                    </p>
                  )}
                </div>
              </section>

              {/* Low-score quizzes (if any not in recommended) */}
              {data.low_score_quizzes?.length > 0 && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
                  <h3 className="text-lg font-bold text-amber-900">Low-Score Quizzes</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-800">
                    {data.low_score_quizzes.map((q) => (
                      <li key={`low-${q.quiz_id}`} className="flex flex-wrap items-center gap-2">
                        <span>
                          {q.quiz_title} ({q.percentage}%)
                        </span>
                        <Link
                          to={q.practice_path || QUIZ_ATTEMPT_ROUTE(q.quiz_id)}
                          className="font-semibold text-green-700 hover:underline"
                        >
                          Practice Again
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Parent-friendly summary */}
              <section className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-green-900">Parent-Friendly Summary</h3>
                <p className="mt-3 text-base leading-7 text-gray-800">
                  {data.parent_friendly_summary}
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default LearningDiagnosis;
