import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import { clearAuth, getAuthSnapshot } from "../../utils/auth";
import { buildPublicNavItems } from "../../utils/publicNav";
import axiosInstance from "../../utils/axiosInstance";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;

const displayQuizTitle = (title) => {
  const t = String(title || "").trim();
  return t.replace(/^\s*\d+\s*[-–—.:]\s*/, "");
};

const getLetter = (name) => {
  const ch = String(name || "").trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(ch) ? ch : "#";
};

const TopicIndexPage = () => {
  const auth = useMemo(() => getAuthSnapshot(), []);
  const { role, userFullName, gradeId, isStudent, isAuthed, accessToken } = auth;

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [grades, setGrades] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [topics, setTopics] = useState([]);
  const [openTopicIds, setOpenTopicIds] = useState(new Set());
  const [historyMap, setHistoryMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const navItems = useMemo(() => buildPublicNavItems(role), [role]);

  useEffect(() => {
    if (isStudent) return undefined;

    const controller = new AbortController();

    const fetchGrades = async () => {
      try {
        const res = await fetch(`${API}grades/`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to fetch grades (${res.status})`);
        const data = await res.json();
        setGrades(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err?.name !== "AbortError") {
          setGrades([]);
        }
      }
    };

    fetchGrades();
    return () => controller.abort();
  }, [isStudent]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTopics = async () => {
      setLoading(true);
      setError("");

      if (isStudent && !gradeId) {
        setTopics([]);
        setError("Your grade is not set. Please contact admin.");
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        const effectiveGradeId = isStudent ? gradeId : selectedGradeId;
        const includeQuizzes = Boolean(effectiveGradeId);

        params.set("include_quizzes", includeQuizzes ? "1" : "0");
        if (effectiveGradeId) params.set("grade", effectiveGradeId);

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
  }, [isStudent, gradeId, selectedGradeId]);

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

  const sectionEntries = useMemo(() => {
    const grouped = {};
    sortedTopics.forEach((topic) => {
      const letter = getLetter(topic?.name);
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(topic);
    });

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((l) => grouped[l]?.length);
    if (grouped["#"]?.length) letters.push("#");
    return letters.map((letter) => [letter, grouped[letter]]);
  }, [sortedTopics]);

  const showSelectGradeHint = !isStudent && !selectedGradeId;

  const toggleTopic = (topicId) => {
    setOpenTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

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
          <p className="mt-1 text-sm text-gray-600">Browse by Topic (A–Z).</p>
        </header>

        {!isStudent && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <label htmlFor="topic-grade" className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Grade
            </label>
            <select
              id="topic-grade"
              value={selectedGradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              className="w-full sm:w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Grades</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Loading topics...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
          ) : topics.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">No topics created yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sectionEntries.map(([letter, letterTopics]) => (
                <div key={letter} className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="pt-0.5 text-2xl font-extrabold text-green-800">{letter}.</div>
                    <div className="flex-1 space-y-2">
                      {letterTopics.map((topic) => {
                        const isOpen = openTopicIds.has(topic.id);
                        return (
                          <article key={topic.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() => toggleTopic(topic.id)}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-green-50"
                            >
                              <div className="min-w-0">
                                <h2 className="truncate text-sm font-bold text-gray-900">{topic.name}</h2>
                                <p className="text-[11px] text-gray-500">{topic.grade?.name || "Unknown Grade"}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                                  {topic.quiz_count || 0}
                                </span>
                                <span className="text-gray-500 text-sm">{isOpen ? "▾" : "▸"}</span>
                              </div>
                            </button>

                            {isOpen && (
                              <div className="border-t border-gray-100 px-3 py-3 space-y-2">
                                {showSelectGradeHint ? (
                                  <p className="text-xs text-gray-500">Select a grade to load quizzes.</p>
                                ) : Array.isArray(topic.quizzes) && topic.quizzes.length > 0 ? (
                                  topic.quizzes.map((quiz, index) => {
                                    const scoreText = scoreTextForQuiz(quiz.id);
                                    return (
                                      <Link
                                        key={`topic-quiz-${topic.id}-${quiz.id}`}
                                        to={`/student/attempt-quiz/${quiz.id}`}
                                        className="block rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-green-50"
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <p className="truncate text-sm font-semibold text-gray-800">
                                            Lesson {index + 1}: {displayQuizTitle(quiz.title)}
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
                                  <p className="text-xs text-gray-500">No quizzes assigned yet.</p>
                                )}
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default TopicIndexPage;
