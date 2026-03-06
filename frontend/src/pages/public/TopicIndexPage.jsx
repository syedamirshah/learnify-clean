import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import { clearAuth, getAuthSnapshot, hydrateStudentGradeIdFromProfile } from "../../utils/auth";
import { buildPublicNavItems } from "../../utils/publicNav";
import axiosInstance from "../../utils/axiosInstance";

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

        const res = await fetch(`${API}landing/topics/?${params.toString()}`, { signal: controller.signal });
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
        return String(a?.name || "").localeCompare(String(b?.name || ""), undefined, { sensitivity: "base" });
      });
    });

    return Object.entries(grouped).sort(([gradeA], [gradeB]) =>
      gradeA.localeCompare(gradeB, undefined, { sensitivity: "base" })
    );
  }, [topics]);

  const scoreTextForQuiz = (quizId) => {
    if (!isStudent) return null;
    const row = historyMap[String(quizId)];
    if (!row) return null;

    const marks = row.marks_obtained ?? row.score ?? null;
    const total = row.total_marks ?? (((row.total_questions || 0) * (row.marks_per_question || 0)) || null);
    if (marks !== null && total) return `Score: ${marks}/${total}`;
    if (row.percentage !== null && row.percentage !== undefined) return `Score: ${row.percentage}%`;
    return null;
  };

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
      brandMotto="Learning with Responsibility"
      isAuthenticated={isAuthed}
      userFullName={userFullName}
      navItems={navItems}
      isMobileDrawerOpen={mobileDrawerOpen}
      onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
      onLogoutClick={handleLogout}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        <header className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-green-900">Topic Index</h1>
          <p className="mt-1 text-sm text-gray-600">Browse by Topic.</p>
        </header>

        <section className="space-y-4">
          {isStudent && !gradeId && accessToken && (hydrating || !hydrationChecked) ? (
            <div className="text-center py-10 text-gray-500">Loading your learning path...</div>
          ) : isStudent && !gradeId && accessToken && hydrationChecked ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
              Your grade is not set. Please contact admin.
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Loading topics...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
          ) : topics.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">No topics created yet.</div>
          ) : (
            topicsByGrade.map(([gradeName, gradeTopics]) => (
              <div key={gradeName} className="space-y-4">
                <div className="flex items-center justify-center gap-6 mt-4 mb-6">
                  <div className="h-[2px] w-28 bg-green-300 rounded-full" />
                  <div
                    className="
                      flex items-center justify-center whitespace-nowrap
                      px-10 py-4
                      rounded-full
                      border-2 border-green-300
                      bg-green-100
                      shadow-md
                      text-3xl
                      font-extrabold
                      text-green-900
                    "
                  >
                    {gradeName}
                  </div>
                  <div className="h-[2px] w-28 bg-green-300 rounded-full" />
                </div>
                <div className="columns-1 md:columns-2 gap-6">
                  {gradeTopics.map((topic) => (
                    <article
                      key={topic.id}
                      className="mb-6 break-inside-avoid rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-baseline gap-3">
                        <h3 className="text-2xl font-bold text-green-700">{topic.name}</h3>
                      </div>

                      <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
                        {Array.isArray(topic.quizzes) && topic.quizzes.length > 0 ? (
                          topic.quizzes.map((quiz, index) => {
                            const scoreText = scoreTextForQuiz(quiz.id);
                            return (
                              <Link
                                key={`topic-quiz-${topic.id}-${quiz.id}`}
                                to={`/student/attempt-quiz/${quiz.id}`}
                                className="group block rounded-md px-2 py-1 hover:bg-green-50"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm sm:text-[1.05rem] leading-snug text-gray-900">
                                    <span className="mr-2 text-black">{index + 1}</span>
                                    <span className="text-green-800 group-hover:text-green-900">
                                      {displayQuizTitle(quiz.title)}
                                    </span>
                                  </p>
                                  {scoreText ? (
                                    <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                                      {scoreText}
                                    </span>
                                  ) : null}
                                </div>
                              </Link>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">No quizzes assigned yet.</p>
                        )}
                      </div>
                    </article>
                  ))}
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
