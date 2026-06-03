import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import LearningPathSelector from "../../components/layout/LearningPathSelector";
import { clearAuth, getAuthSnapshot, hydrateStudentGradeIdFromProfile } from "../../utils/auth";
import { buildPublicNavItems } from "../../utils/publicNav";
import axiosInstance from "../../utils/axiosInstance";
import {
  findContinueLearningTopic,
  getSkillStatus,
  getTopicGroupIcon,
  getTopicGroupPalette,
  getTopicGroupProgress,
} from "../../utils/topicIndexView";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;

const displayQuizTitle = (title) => {
  const t = String(title || "").trim();
  return t.replace(/^\s*\d+\s*[-–—.:]\s*/, "");
};

const TopicIndexPage = () => {
  const [auth, setAuth] = useState(() => getAuthSnapshot());
  const { role, userFullName, isStudent, isAuthed, accessToken } = auth;

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [topics, setTopics] = useState([]);
  const [historyMap, setHistoryMap] = useState({});
  const [gradeId, setGradeId] = useState("");
  const [hydrating, setHydrating] = useState(false);
  const [hydrationChecked, setHydrationChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const navItems = useMemo(() => buildPublicNavItems(role), [role]);

  useEffect(() => {
    const snap = getAuthSnapshot();
    const initialGradeId =
      snap.gradeId ||
      localStorage.getItem("user_grade_id") ||
      localStorage.getItem("grade_id") ||
      "";
    setGradeId(initialGradeId ? String(initialGradeId) : "");
    setAuth(snap);
  }, []);

  useEffect(() => {
    let alive = true;

    const resolveStudentGrade = async () => {
      if (!isStudent || !accessToken) {
        if (alive) setHydrationChecked(true);
        return;
      }

      if (gradeId) {
        if (alive) setHydrationChecked(true);
        return;
      }

      setHydrating(true);
      try {
        const result = await hydrateStudentGradeIdFromProfile(API);
        if (result?.reason === "401") {
          clearAuth();
          window.location.href = "/login";
          return;
        }

        const refreshedAuth = getAuthSnapshot();
        const hydratedGradeId =
          refreshedAuth.gradeId ||
          localStorage.getItem("user_grade_id") ||
          localStorage.getItem("grade_id") ||
          "";

        if (alive) {
          setAuth(refreshedAuth);
          setGradeId(hydratedGradeId ? String(hydratedGradeId) : "");
        }
      } catch {
        if (alive) setAuth(getAuthSnapshot());
      } finally {
        if (alive) {
          setHydrating(false);
          setHydrationChecked(true);
        }
      }
    };

    resolveStudentGrade();
    return () => {
      alive = false;
    };
  }, [isStudent, accessToken, gradeId]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTopics = async () => {
      if (isStudent && !gradeId && accessToken && (hydrating || !hydrationChecked)) return;

      setLoading(true);
      setError("");

      if (isStudent && !gradeId) {
        setTopics([]);
        setError("");
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("include_quizzes", "1");
        if (isStudent && gradeId) params.set("grade", gradeId);

        const res = await fetch(`${API}landing/topics/?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Failed to fetch topics (${res.status})`);
        const data = await res.json();
        setTopics(Array.isArray(data?.results) ? data.results : []);
      } catch (err) {
        if (err?.name !== "AbortError") {
          setError("Failed to load topics.");
          setTopics([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchTopics();
    return () => controller.abort();
  }, [isStudent, gradeId, accessToken, hydrating, hydrationChecked]);

  useEffect(() => {
    if (!isStudent || !accessToken) return;

    let mounted = true;
    const fetchHistory = async () => {
      try {
        const res = await axiosInstance.get("student/quiz-history/");
        const results = Array.isArray(res?.data?.results) ? res.data.results : [];
        const map = {};
        results.forEach((row) => {
          const key = String(row.quiz_id || "");
          if (key) map[key] = row;
        });
        if (mounted) setHistoryMap(map);
      } catch {
        if (mounted) setHistoryMap({});
      }
    };

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [isStudent, accessToken]);

  const topicsByGrade = useMemo(() => {
    const grouped = topics.reduce((acc, topic) => {
      const gradeName = String(topic?.grade?.name || "Unknown Grade");
      if (!acc[gradeName]) acc[gradeName] = [];
      acc[gradeName].push(topic);
      return acc;
    }, {});

    Object.keys(grouped).forEach((gradeName) => {
      grouped[gradeName].sort((a, b) => {
        const aOrder = Number.isFinite(Number(a?.order)) ? Number(a.order) : null;
        const bOrder = Number.isFinite(Number(b?.order)) ? Number(b.order) : null;
        if (aOrder !== null && bOrder !== null && aOrder !== bOrder) return aOrder - bOrder;
        return String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
          sensitivity: "base",
        });
      });
    });

    return Object.entries(grouped).sort(([gradeA], [gradeB]) =>
      gradeA.localeCompare(gradeB, undefined, { sensitivity: "base" })
    );
  }, [topics]);

  const displayGradeLabel = useMemo(() => {
    if (topicsByGrade.length === 1) return topicsByGrade[0][0];
    return localStorage.getItem("user_grade") || topicsByGrade[0]?.[0] || "Your Grade";
  }, [topicsByGrade]);

  const continueLearning = useMemo(() => {
    if (!isStudent || !topics.length) return null;
    return findContinueLearningTopic(topics, historyMap);
  }, [isStudent, topics, historyMap]);

  const handleLogout = () => {
    clearAuth();
    navigate("/", { replace: true });
  };

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      logoHref="/learn"
      brandTitle="Learnify Pakistan"
      brandMotto="Practicing Math Responsibly"
      isAuthenticated={isAuthed}
      userFullName={userFullName}
      navItems={navItems}
      isMobileDrawerOpen={mobileDrawerOpen}
      onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
      onLogoutClick={handleLogout}
    >
      <LearningPathSelector activePath="topic-index" className="mt-0" />

      <div className="mx-auto max-w-6xl space-y-5 px-4 pb-8 pt-2 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-5 py-4 shadow-sm ring-1 ring-emerald-100">
          <h1 className="text-xl font-black text-emerald-950 md:text-2xl">Explore by Topic</h1>
          <p className="mt-1 text-sm text-gray-600">
            Choose a skill area and practice exercises grouped by concept.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Topic Index", displayGradeLabel, "Math Skills"].map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200"
              >
                {chip}
              </span>
            ))}
          </div>
        </section>

        {isStudent && continueLearning?.quiz && (
          <section className="rounded-3xl bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-4 shadow-md ring-1 ring-sky-200">
            <p className="text-sm font-bold text-sky-900">🎯 Continue Learning</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recommended next
            </p>
            <p className="mt-1 font-bold text-gray-900">
              {displayQuizTitle(continueLearning.quiz.title)}
            </p>
            {continueLearning.topic?.name && (
              <p className="text-sm text-gray-600">{continueLearning.topic.name}</p>
            )}
            <Link
              to={`/student/attempt-quiz/${continueLearning.quiz.id}`}
              className="mt-3 inline-flex rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-emerald-700"
            >
              {continueLearning.cta || "Start Practice"}
            </Link>
          </section>
        )}

        <section className="space-y-4">
          {isStudent && !gradeId && accessToken && (hydrating || !hydrationChecked) ? (
            <div className="py-10 text-center text-gray-500">Loading your learning path...</div>
          ) : isStudent && !gradeId && accessToken && hydrationChecked ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-600">
              Your grade is not set. Please contact admin.
            </div>
          ) : loading ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
              Loading topics...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error}
            </div>
          ) : topics.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
              No topics created yet.
            </div>
          ) : (
            topicsByGrade.map(([gradeName, gradeTopics]) => (
              <div key={gradeName} className="space-y-4">
                <div className="mb-4 flex items-center justify-center gap-6">
                  <div className="h-[2px] w-28 rounded-full bg-green-300" />
                  <div className="whitespace-nowrap rounded-full border-2 border-green-300 bg-green-100 px-10 py-4 text-3xl font-extrabold text-green-900 shadow-md">
                    {gradeName}
                  </div>
                  <div className="h-[2px] w-28 rounded-full bg-green-300" />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {gradeTopics.map((topic, topicIndex) => {
                    const palette = getTopicGroupPalette(topicIndex);
                    const topicIcon = getTopicGroupIcon(topic.name, topicIndex);
                    const progress = getTopicGroupProgress(topic.quizzes, historyMap);
                    const skillLabel = progress.total === 1 ? "skill" : "skills";

                    return (
                      <article
                        key={topic.id}
                        className={`flex flex-col overflow-hidden rounded-3xl border-2 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${palette.cardBg} ${palette.cardBorder}`}
                      >
                        <div className={`border-b px-4 py-3 ${palette.headerBg} ${palette.cardBorder}`}>
                          <div className="flex items-start gap-2">
                            <span className="text-2xl" aria-hidden="true">
                              {topicIcon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className={`text-lg font-black leading-tight ${palette.accent}`}>
                                {topic.name}
                              </h3>
                              <p className="mt-0.5 text-sm font-semibold text-gray-700">
                                {progress.total} {skillLabel}
                                {isStudent && progress.attempted > 0
                                  ? ` · ${progress.attempted} completed`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          {isStudent && progress.total > 0 && (
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${progress.progressPercent}%` }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2 p-3">
                          {Array.isArray(topic.quizzes) && topic.quizzes.length > 0 ? (
                            topic.quizzes.map((quiz) => {
                              const status = getSkillStatus(quiz.id, historyMap, isStudent);
                              const row = historyMap[String(quiz.id)];
                              const pct =
                                row?.percentage !== undefined && row?.percentage !== null
                                  ? Number(row.percentage)
                                  : null;

                              return (
                                <Link
                                  key={`topic-quiz-${topic.id}-${quiz.id}`}
                                  to={`/student/attempt-quiz/${quiz.id}`}
                                  className={`group flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${palette.skillHover}`}
                                >
                                  <span
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-gray-100"
                                    aria-hidden="true"
                                  >
                                    {status.icon}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold leading-snug text-gray-900 group-hover:text-emerald-900">
                                      {displayQuizTitle(quiz.title)}
                                    </p>
                                    {isStudent && pct !== null && (
                                      <p className="mt-0.5 text-xs text-gray-500">{pct}%</p>
                                    )}
                                  </div>
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.badgeClass}`}
                                  >
                                    {status.label}
                                  </span>
                                </Link>
                              );
                            })
                          ) : (
                            <p className="px-2 py-3 text-sm text-gray-500">No quizzes assigned yet.</p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default TopicIndexPage;
