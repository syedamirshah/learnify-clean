import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import { clearAuth, getAuthSnapshot, hydrateStudentGradeIdFromProfile } from "../../utils/auth";
import { buildPublicNavItems } from "../../utils/publicNav";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;

const groupByChapter = (quizzes = []) => {
  const groups = {};
  quizzes.forEach((q) => {
    const chapter = q?.chapter?.name || "General";
    if (!groups[chapter]) groups[chapter] = [];
    groups[chapter].push(q);
  });
  return groups;
};

const getWeekQuizCount = (week = {}) => {
  const quizCount = Number(week?.quiz_count ?? 0);
  const quizzesLength = Array.isArray(week?.quizzes) ? week.quizzes.length : 0;
  return Math.max(Number.isFinite(quizCount) ? quizCount : 0, quizzesLength);
};

const WeeklyPlanPage = () => {
  const [auth, setAuth] = useState(() => getAuthSnapshot());
  const { role, userFullName, isStudent, isAuthed } = auth;

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [grades, setGrades] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [weeks, setWeeks] = useState([]);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationChecked, setHydrationChecked] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [historyMap, setHistoryMap] = useState({});
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
      if (!isStudent || !auth.accessToken) {
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
  }, [isStudent, auth.accessToken, gradeId]);

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

    const fetchWeeks = async () => {
      if (isStudent && !gradeId && auth.accessToken && (hydrating || !hydrationChecked)) return;

      setLoading(true);
      setError("");

      if (isStudent && !gradeId) {
        setWeeks([]);
        setError("");
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        const effectiveGradeId = isStudent ? gradeId : selectedGradeId;
        params.set("include_quizzes", "1");
        if (effectiveGradeId) {
          params.set("grade", effectiveGradeId);
          params.set("subject", effectiveGradeId);
        }

        const bearerToken = auth.accessToken || localStorage.getItem("token") || localStorage.getItem("access_token");
        const headers = bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {};

        const res = await fetch(`${API}landing/weeks/?${params.toString()}`, {
          signal: controller.signal,
          headers,
        });
        if (!res.ok) throw new Error(`Failed to fetch weeks (${res.status})`);
        const data = await res.json();
        setExpandedWeek(null);
        setWeeks(Array.isArray(data?.results) ? data.results : []);
      } catch (err) {
        if (err?.name !== "AbortError") {
          setError("Failed to load weeks.");
          setWeeks([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchWeeks();
    return () => controller.abort();
  }, [isStudent, gradeId, selectedGradeId, hydrating, hydrationChecked, auth.accessToken]);

  useEffect(() => {
    if (!isStudent || !auth.accessToken) {
      setHistoryMap({});
      return;
    }

    let mounted = true;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API}student/quiz-history/`, {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        });
        if (!res.ok) throw new Error(`Failed to fetch quiz history (${res.status})`);
        const data = await res.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        const map = {};
        results.forEach((row) => {
          const key = String(row?.quiz_id || "");
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
  }, [isStudent, auth.accessToken]);

  const handleLogout = () => {
    clearAuth();
    navigate("/", { replace: true });
  };

  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) => {
      const gradeA = Number(a?.grade?.id || 0);
      const gradeB = Number(b?.grade?.id || 0);
      if (gradeA !== gradeB) return gradeA - gradeB;
      const orderA = Number.isFinite(Number(a?.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(Number(b?.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return String(a?.name || "").localeCompare(String(b?.name || ""));
    });
  }, [weeks]);

  const dedupedWeeks = useMemo(() => {
    if (isStudent) return sortedWeeks;

    const byGradeAndOrder = new Map();
    sortedWeeks.forEach((week) => {
      const gradeId = Number(week?.grade?.id || 0);
      const order = Number(week?.order || 0);
      const key = `${gradeId}-${order}`;
      const existing = byGradeAndOrder.get(key);

      if (!existing) {
        byGradeAndOrder.set(key, week);
        return;
      }

      const existingCount = getWeekQuizCount(existing);
      const currentCount = getWeekQuizCount(week);
      if (currentCount > existingCount) {
        byGradeAndOrder.set(key, week);
        return;
      }

      if (currentCount === existingCount && Number(week?.id || Number.MAX_SAFE_INTEGER) < Number(existing?.id || Number.MAX_SAFE_INTEGER)) {
        byGradeAndOrder.set(key, week);
      }
    });

    return Array.from(byGradeAndOrder.values()).sort((a, b) => {
      const gradeA = Number(a?.grade?.id || 0);
      const gradeB = Number(b?.grade?.id || 0);
      if (gradeA !== gradeB) return gradeA - gradeB;
      const orderA = Number(a?.order || Number.MAX_SAFE_INTEGER);
      const orderB = Number(b?.order || Number.MAX_SAFE_INTEGER);
      if (orderA !== orderB) return orderA - orderB;
      return Number(a?.id || 0) - Number(b?.id || 0);
    });
  }, [isStudent, sortedWeeks]);

  const weeksByGrade = useMemo(() => {
    return dedupedWeeks.reduce((acc, week) => {
      const key = week?.grade?.name || "Unknown Grade";
      if (!acc[key]) acc[key] = [];
      acc[key].push(week);
      return acc;
    }, {});
  }, [dedupedWeeks]);

  const completedWeeks = useMemo(() => {
    return dedupedWeeks.filter(
      (week) =>
        Number(week?.total_quizzes || 0) > 0 &&
        Number(week?.completed_quizzes || 0) >= Number(week?.total_quizzes || 0)
    ).length;
  }, [dedupedWeeks]);

  const studentProgressAvailable = useMemo(() => {
    if (!isStudent || dedupedWeeks.length === 0) return false;
    return dedupedWeeks.every(
      (week) =>
        week?.completed_quizzes !== null &&
        week?.completed_quizzes !== undefined &&
        week?.total_quizzes !== null &&
        week?.total_quizzes !== undefined
    );
  }, [isStudent, dedupedWeeks]);

  const handleWeekToggle = (week) => {
    setExpandedWeek(expandedWeek === week.id ? null : week.id);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-green-900">Weekly Plan</h1>
          <p className="mt-1 text-sm text-gray-600">Browse quizzes grouped week-wise and follow your learning sequence.</p>
          {isStudent && (
            <p className="mt-2 text-sm font-semibold text-green-800">Weeks Completed: {completedWeeks} / 30</p>
          )}
        </header>

        {!isStudent && (
          <div className="my-10">
            <div className="flex items-center justify-center gap-6">
              <div className="hidden sm:block flex-1 h-[2px] bg-green-200" />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setGradeDropdownOpen((prev) => !prev)}
                  className="px-8 sm:px-12 py-4 sm:py-6 rounded-full bg-green-100 border-2 border-green-300 text-green-900 text-xl sm:text-3xl font-bold shadow-md flex items-center gap-3 hover:bg-green-200 transition"
                >
                  {selectedGradeId
                    ? grades.find((grade) => String(grade.id) === String(selectedGradeId))?.name || "Select Grade"
                    : "All Grades"}
                  <span className="text-base sm:text-lg">⌄</span>
                </button>
                {gradeDropdownOpen && (
                  <div className="absolute z-20 mt-2 w-full min-w-[220px] rounded-xl border border-green-200 bg-white shadow-lg py-1">
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-green-50"
                      onClick={() => {
                        setSelectedGradeId("");
                        setGradeDropdownOpen(false);
                      }}
                    >
                      All Grades
                    </button>
                    {grades.map((grade) => (
                      <button
                        key={grade.id}
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-green-50"
                        onClick={() => {
                          setSelectedGradeId(String(grade.id));
                          setGradeDropdownOpen(false);
                        }}
                      >
                        {grade.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="hidden sm:block flex-1 h-[2px] bg-green-200" />
            </div>
          </div>
        )}

        <section className="space-y-4">
          {isStudent && !gradeId && auth.accessToken && (hydrating || !hydrationChecked) ? (
            <div className="text-center py-10 text-gray-500">Loading your learning path...</div>
          ) : isStudent && !gradeId && auth.accessToken && hydrationChecked ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
              Your grade is not set. Please contact admin.
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={`week-skeleton-${idx}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
                  <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
                  <div className="h-3 w-28 bg-gray-200 rounded mb-2" />
                  <div className="h-2 w-full bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
          ) : weeks.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
              Weekly plan is not generated yet. Please ask admin to regenerate.
            </div>
          ) : (
            <>
              {!isStudent && !selectedGradeId
                ? Object.entries(weeksByGrade).map(([gradeName, gradeWeeks]) => (
                    <div key={`weekly-grade-group-${gradeName}`} className="space-y-3">
                      <h2 className="text-3xl font-extrabold text-green-900">{gradeName}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gradeWeeks.map((week) => {
                          const completed = Number(week?.completed_quizzes || 0);
                          const total = Number(week?.total_quizzes || week?.quiz_count || 0);
                          const percent = Number(week?.progress_percent ?? 0);
                          const isComplete = isStudent && studentProgressAvailable && total > 0 && completed >= total;
                          const isExpanded = expandedWeek === week.id;

                          return (
                            <article
                              key={week.id}
                              className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition ${
                                isComplete
                                  ? "border-green-300 bg-green-50"
                                  : "border-red-200 bg-red-50"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleWeekToggle(week)}
                                className="w-full text-left"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <h2 className="text-lg font-bold text-gray-900">{week.name}</h2>
                                  <span className="text-xs font-semibold text-gray-700">
                                    {isExpanded ? "Hide" : "View"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-600">
                                  {isStudent ? `Completed ${completed} / ${total}` : `${week.quiz_count || 0} quizzes`}
                                </p>
                              </button>

                              {isExpanded && (
                                <div className="mt-3">
                                  {isStudent && (
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
                                    </div>
                                  )}

                                  {Array.isArray(week.quizzes) && week.quizzes.length > 0 ? (
                                    Object.entries(groupByChapter(week.quizzes)).map(([chapterName, quizzes]) => (
                                      <div key={`week-chapter-${week.id}-${chapterName}`} className="mt-3">
                                        <h3 className="mb-1 text-sm font-semibold text-green-800">{chapterName}</h3>
                                        <div className="space-y-1">
                                          {quizzes.map((quiz) => (
                                            <div
                                              key={`week-quiz-${week.id}-${quiz.id}`}
                                              className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                                            >
                                              <Link
                                                to={`/student/attempt-quiz/${quiz.id}`}
                                                className="text-sm text-green-800 hover:text-green-900 hover:underline pr-3"
                                              >
                                                {quiz.title}
                                              </Link>
                                              {isStudent && historyMap[String(quiz.id)]?.attempt_id ? (
                                                <Link
                                                  to={`/student/quiz-result/${historyMap[String(quiz.id)].attempt_id}/`}
                                                  className="shrink-0 text-xs font-semibold text-green-700 hover:text-green-900 hover:underline"
                                                >
                                                  Result
                                                </Link>
                                              ) : (
                                                <span className="shrink-0 text-xs font-semibold text-gray-500">
                                                  Not Attempted
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))
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
                  ))
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dedupedWeeks.map((week) => {
                const completed = Number(week?.completed_quizzes || 0);
                const total = Number(week?.total_quizzes || week?.quiz_count || 0);
                const percent = Number(week?.progress_percent ?? 0);
                const isComplete = isStudent && studentProgressAvailable && total > 0 && completed >= total;
                const isExpanded = expandedWeek === week.id;

                return (
                  <article
                    key={week.id}
                    className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition ${
                      isComplete
                        ? "border-green-300 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleWeekToggle(week)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-gray-900">{week.name}</h2>
                        <span className="text-xs font-semibold text-gray-700">
                          {isExpanded ? "Hide" : "View"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {isStudent ? `Completed ${completed} / ${total}` : `${week.quiz_count || 0} quizzes`}
                      </p>
                    </button>

                    {isExpanded && (
                      <div className="mt-3">
                        {isStudent && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        )}

                        {Array.isArray(week.quizzes) && week.quizzes.length > 0 ? (
                          Object.entries(groupByChapter(week.quizzes)).map(([chapterName, quizzes]) => (
                            <div key={`week-chapter-${week.id}-${chapterName}`} className="mt-3">
                              <h3 className="mb-1 text-sm font-semibold text-green-800">{chapterName}</h3>
                              <div className="space-y-1">
                                {quizzes.map((quiz) => (
                                  <div
                                    key={`week-quiz-${week.id}-${quiz.id}`}
                                    className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                                  >
                                    <Link
                                      to={`/student/attempt-quiz/${quiz.id}`}
                                      className="text-sm text-green-800 hover:text-green-900 hover:underline pr-3"
                                    >
                                      {quiz.title}
                                    </Link>
                                    {isStudent && historyMap[String(quiz.id)]?.attempt_id ? (
                                      <Link
                                        to={`/student/quiz-result/${historyMap[String(quiz.id)].attempt_id}/`}
                                        className="shrink-0 text-xs font-semibold text-green-700 hover:text-green-900 hover:underline"
                                      >
                                        Result
                                      </Link>
                                    ) : (
                                      <span className="shrink-0 text-xs font-semibold text-gray-500">
                                        Not Attempted
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">No quizzes assigned yet.</p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
              </div>}
            </>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default WeeklyPlanPage;
