import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import { buildPublicNavItems } from "../../utils/publicNav";

const QUIZ_ATTEMPT_ROUTE = (quizId) => `/student/attempt-quiz/${quizId}`;

const statusBadge = {
  strong: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  improving: "bg-amber-100 text-amber-900 ring-amber-200",
  weak: "bg-red-100 text-red-800 ring-red-200",
};

const statusLabel = {
  strong: "Strong",
  improving: "Improving",
  weak: "Needs Practice",
};

const healthTheme = {
  Strong: {
    card: "from-emerald-600 via-emerald-500 to-teal-500",
    badge: "bg-white/20 text-white ring-white/30",
    ring: "ring-emerald-300/50",
  },
  Improving: {
    card: "from-amber-500 via-yellow-500 to-amber-400",
    badge: "bg-white/20 text-white ring-white/30",
    ring: "ring-amber-300/50",
  },
  "Needs Attention": {
    card: "from-red-600 via-rose-500 to-red-500",
    badge: "bg-white/20 text-white ring-white/30",
    ring: "ring-red-300/50",
  },
};

const trendIcon = {
  Improving: { symbol: "↗", className: "text-emerald-700" },
  Stable: { symbol: "→", className: "text-gray-700" },
  Declining: { symbol: "↘", className: "text-red-700" },
};

const sectionCard =
  "overflow-hidden rounded-3xl border border-emerald-200/80 bg-white shadow-lg shadow-emerald-900/5";
const sectionHeader =
  "border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 md:px-6";

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
  const health = healthTheme[data?.health_status] || healthTheme.Improving;
  const trendMeta = trendIcon[data?.learning_trend?.trend] || trendIcon.Stable;

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
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-8 text-gray-800 md:px-6">
        <header className="mx-auto mb-8 max-w-[1100px]">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            AI-style learning insights
          </p>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight text-emerald-950 md:text-4xl">
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
              className="rounded-3xl border border-emerald-200 bg-white py-14 text-center font-semibold text-emerald-800 shadow-lg"
            >
              Loading your learning diagnosis...
            </div>
          ) : error ? (
            <div
              aria-live="polite"
              className="rounded-3xl border border-red-200 bg-red-50 px-4 py-8 text-center font-semibold text-red-700 shadow-lg"
            >
              {error}
            </div>
          ) : !hasData ? (
            <div className="rounded-3xl border-2 border-emerald-200 bg-white p-8 text-center shadow-xl">
              <p className="text-base font-semibold text-gray-800">
                You have not attempted enough quizzes yet. Start practicing to receive
                your learning diagnosis.
              </p>
              <Link
                to="/learn"
                className="mt-5 inline-flex rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700"
              >
                Start Practicing
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. Learning Health Score */}
              <section
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${health.card} p-6 text-white shadow-2xl ring-1 ${health.ring} md:p-8`}
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
                <div className="relative">
                  <p className="text-sm font-bold uppercase tracking-widest text-white/90">
                    Learning Health Score
                  </p>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <span className="text-5xl font-black leading-none md:text-7xl">
                      {data.learning_health_score ?? 0}
                    </span>
                    <span className="pb-2 text-2xl font-bold text-white/80 md:text-3xl">
                      / 100
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-white/90">Status:</span>
                    <span
                      className={`inline-flex rounded-full px-4 py-1.5 text-sm font-bold ring-1 ${health.badge}`}
                    >
                      {data.health_status || "Improving"}
                    </span>
                  </div>
                </div>
              </section>

              {/* 2. Attention Required */}
              <section className={sectionCard}>
                <div className={`${sectionHeader} bg-gradient-to-r from-red-50 to-white`}>
                  <h3 className="text-xl font-black text-red-900">Attention Required</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Chapters that need the most practice right now.
                  </p>
                </div>
                <div className="grid gap-4 p-5 md:grid-cols-3 md:p-6">
                  {data.attention_required?.length ? (
                    data.attention_required.map((item) => (
                      <div
                        key={item.chapter_name}
                        className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 shadow-md"
                      >
                        <div className="font-bold text-red-950">{item.chapter_name}</div>
                        <div className="mt-2 text-3xl font-black text-red-700">
                          {item.percentage}%
                        </div>
                        <span className="mt-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 ring-1 ring-red-200">
                          Needs Practice
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full text-sm text-gray-600">
                      No urgent chapter alerts — keep up the great work.
                    </p>
                  )}
                </div>
              </section>

              {/* 3. Learning Trend */}
              <section className={sectionCard}>
                <div className={sectionHeader}>
                  <h3 className="text-xl font-black text-emerald-950">Learning Trend</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Comparing your latest quiz results with earlier attempts.
                  </p>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-3 md:p-6">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Previous
                    </div>
                    <div className="mt-2 text-3xl font-black text-emerald-950">
                      {data.learning_trend?.previous_average ?? 0}%
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Recent
                    </div>
                    <div className="mt-2 text-3xl font-black text-emerald-950">
                      {data.learning_trend?.recent_average ?? 0}%
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-md">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Trend
                    </div>
                    <div
                      className={`mt-2 flex items-center gap-2 text-2xl font-black ${trendMeta.className}`}
                    >
                      <span>{data.learning_trend?.trend || "Stable"}</span>
                      <span className="text-3xl" aria-hidden="true">
                        {trendMeta.symbol}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. Overall Health Cards */}
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
                    className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-lg shadow-emerald-900/5"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {card.label}
                    </div>
                    <div className="mt-2 text-2xl font-extrabold text-emerald-950">
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* 5. Chapter Mastery */}
              <section className={sectionCard}>
                <div className={sectionHeader}>
                  <h3 className="text-xl font-black text-emerald-950">Chapter Mastery</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Based on your latest result for each quiz.
                  </p>
                </div>
                <div className="p-5 md:p-6">
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-emerald-100 text-xs uppercase tracking-wide text-gray-500">
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
                        className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-emerald-950">{ch.chapter_name}</div>
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

              {/* 6. Recommended Practice */}
              <section className={sectionCard}>
                <div className={sectionHeader}>
                  <h3 className="text-xl font-black text-emerald-950">Recommended Practice</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Focus on weak chapters and low-score quizzes first.
                  </p>
                </div>
                <div className="divide-y divide-emerald-100 p-5 md:p-6">
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
                          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700"
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

              {data.low_score_quizzes?.length > 0 && (
                <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 shadow-lg">
                  <h3 className="text-lg font-bold text-amber-900">Low-Score Quizzes</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-800">
                    {data.low_score_quizzes.map((q) => (
                      <li key={`low-${q.quiz_id}`} className="flex flex-wrap items-center gap-2">
                        <span>
                          {q.quiz_title} ({q.percentage}%)
                        </span>
                        <Link
                          to={q.practice_path || QUIZ_ATTEMPT_ROUTE(q.quiz_id)}
                          className="font-semibold text-emerald-700 hover:underline"
                        >
                          Practice Again
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 7. Parent-Friendly Summary */}
              <section className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-xl md:p-8">
                <h3 className="text-lg font-bold text-emerald-950">Parent-Friendly Summary</h3>
                <p className="mt-3 text-base leading-8 text-gray-800">
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
