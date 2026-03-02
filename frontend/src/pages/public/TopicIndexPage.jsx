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
  const [hydratingGrade, setHydratingGrade] = useState(true);
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

    async function resolveStudentGrade() {
      const snap = getAuthSnapshot();
      const studentRole = snap.role === "student";

      if (!studentRole) {
        if (alive) setHydratingGrade(false);
        return;
      }

      const existing =
        gradeId ||
        localStorage.getItem("user_grade_id") ||
        localStorage.getItem("grade_id");

      if (existing) {
        if (alive) {
          setGradeId(String(existing));
          setHydratingGrade(false);
        }
        return;
      }

      try {
        const result = await hydrateStudentGradeIdFromProfile(API);
        if (result?.unauthorized) {
          clearAuth();
          window.location.href = "/login";
          return;
        }
        const hydrated =
          localStorage.getItem("user_grade_id") ||
          localStorage.getItem("grade_id") ||
          "";
        if (alive) {
          setGradeId(hydrated ? String(hydrated) : "");
          setAuth(getAuthSnapshot());
        }
      } catch {
        clearAuth();
        window.location.href = "/login";
        return;
      } finally {
        if (alive) setHydratingGrade(false);
      }
    }

    resolveStudentGrade();
    return () => {
      alive = false;
    };
  }, [gradeId]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTopics = async () => {
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
  }, [isStudent, gradeId]);

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

  const sortedTopics = useMemo(
    () =>
      [...topics].sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""), undefined, { sensitivity: "base" })
      ),
    [topics]
  );

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
          {isStudent && hydratingGrade ? (
            <div className="text-center py-10 text-gray-500">Loading your learning path...</div>
          ) : isStudent && !hydratingGrade && !gradeId ? (
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {sortedTopics.map((topic) => (
                <article key={topic.id} className="pb-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-2xl font-bold text-green-700">{topic.name}</h2>
                    <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                      {topic.quiz_count || 0}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
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
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default TopicIndexPage;
