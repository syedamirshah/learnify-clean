import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import LearningPathSelector from "../../components/layout/LearningPathSelector";
import { clearAuth, getAuthSnapshot, hydrateStudentGradeIdFromProfile } from "../../utils/auth";
import { buildPublicNavItems } from "../../utils/publicNav";
import {
  DEFAULT_WEEK_COUNT,
  findCurrentWeek,
  getCurrentWeekMotivation,
  getPlanSummary,
  getWeekActionLabel,
  getWeekAverageScore,
  getWeekStatus,
  getWeekTotals,
  WEEK_CARD_STYLES,
} from "../../utils/weeklyPlanView";

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
  const [expandedWeekIds, setExpandedWeekIds] = useState(() => new Set());
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
        setExpandedWeekIds(new Set());
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

  const planSummary = useMemo(
    () => getPlanSummary(dedupedWeeks, DEFAULT_WEEK_COUNT),
    [dedupedWeeks]
  );

  const currentWeek = useMemo(() => findCurrentWeek(dedupedWeeks), [dedupedWeeks]);

  const displayGradeLabel = useMemo(() => {
    const fromWeek = dedupedWeeks[0]?.grade?.name;
    if (fromWeek) return fromWeek;
    if (isStudent) return localStorage.getItem("user_grade") || "Your Grade";
    return selectedGradeId
      ? grades.find((g) => String(g.id) === String(selectedGradeId))?.name || "Your Grade"
      : "Your Grade";
  }, [dedupedWeeks, isStudent, selectedGradeId, grades]);

  const handleWeekToggle = (weekId) => {
    setExpandedWeekIds((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  };

  const focusCurrentWeek = () => {
    if (!currentWeek) return;
    setExpandedWeekIds(new Set([currentWeek.id]));
    const el = document.getElementById(`week-card-${currentWeek.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const renderWeekCard = (week) => {
    const { completed, total, progressPercent } = getWeekTotals(week);
    const status = getWeekStatus(completed, total);
    const styles = WEEK_CARD_STYLES[status.tone] || WEEK_CARD_STYLES.not_started;
    const isExpanded = expandedWeekIds.has(week.id);
    const percent = Number(week?.progress_percent ?? progressPercent);

    return (
      <article
        id={`week-card-${week.id}`}
        key={week.id}
        className={`rounded-3xl border-2 p-4 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${styles.card}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {week.order ? `Week ${week.order}` : "Week"}
            </p>
            <h2 className="text-lg font-black text-gray-900">{week.name}</h2>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${styles.badge}`}
          >
            {status.label}
          </span>
        </div>

        <p className="mt-2 text-sm font-semibold text-gray-700">
          {completed} / {total} exercises
        </p>

        {total > 0 && (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => handleWeekToggle(week.id)}
          className="mt-4 w-full rounded-2xl bg-white/90 px-3 py-2 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition hover:bg-white"
        >
          {getWeekActionLabel(completed, total, isExpanded)}
        </button>

        {isExpanded && (
          <div className="mt-3 border-t border-white/60 pt-3">
            {Array.isArray(week.quizzes) && week.quizzes.length > 0 ? (
              Object.entries(groupByChapter(week.quizzes)).map(([chapterName, quizzes]) => (
                <div
                  key={`week-chapter-${week.id}-${chapterName}`}
                  className="mt-3 rounded-2xl border border-emerald-100 bg-white/80 p-3 first:mt-0"
                >
                  <h3 className="mb-2 text-sm font-semibold text-emerald-900">{chapterName}</h3>
                  <div className="space-y-1.5">
                    {quizzes.map((quiz) => (
                      <div
                        key={`week-quiz-${week.id}-${quiz.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg px-1 py-2 hover:bg-emerald-50/60"
                      >
                        <Link
                          to={`/student/attempt-quiz/${quiz.id}`}
                          className="text-sm font-medium text-emerald-800 hover:underline"
                        >
                          {quiz.title}
                        </Link>
                        {isStudent && historyMap[String(quiz.id)] ? (
                          <span className="shrink-0 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                            {historyMap[String(quiz.id)].percentage}%
                          </span>
                        ) : null}
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
  };

  const renderPlanDashboard = () => {
    if (!dedupedWeeks.length) return null;

    const currentTotals = currentWeek ? getWeekTotals(currentWeek) : null;
    const currentAvg = currentWeek && isStudent ? getWeekAverageScore(currentWeek, historyMap) : null;

    return (
      <div className="space-y-4">
        {currentWeek && (
          <section className="rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 shadow-lg md:p-6">
            <p className="text-sm font-bold text-sky-900">🎯 Current Week</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">{currentWeek.name}</h2>
            {currentTotals && (
              <>
                <p className="mt-2 text-sm text-gray-700">
                  <span className="font-semibold">Completed:</span>{" "}
                  {currentTotals.completed} / {currentTotals.total} exercises
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Progress:</span> {currentTotals.progressPercent}%
                </p>
                {currentAvg !== null && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Average Score:</span> {currentAvg}%
                  </p>
                )}
              </>
            )}
            <p className="mt-3 text-sm font-medium text-gray-600">
              {currentTotals &&
                getCurrentWeekMotivation(currentTotals.completed, currentTotals.total)}
            </p>
            <button
              type="button"
              onClick={focusCurrentWeek}
              className="mt-4 inline-flex rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-emerald-700"
            >
              Continue Week
            </button>
          </section>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-4 shadow-md ring-1 ring-emerald-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Weeks Completed
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-950">
              {planSummary.weeksCompleted} / {planSummary.weekCount}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-md ring-1 ring-sky-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Exercises Completed
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-950">
              {planSummary.exercisesCompleted} / {planSummary.exercisesTotal}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-md ring-1 ring-violet-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Learning Pace
            </p>
            <p className="mt-1 text-xl font-black text-violet-950">{planSummary.pace}</p>
          </div>
        </div>
      </div>
    );
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
      <LearningPathSelector activePath="weekly-plan" className="mt-0" />

      <div className="mx-auto max-w-7xl space-y-4 px-4 pb-8 pt-1 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-5 py-4 shadow-sm ring-1 ring-emerald-100">
          <h1 className="text-xl font-black text-emerald-950 md:text-2xl">
            Your Weekly Learning Plan
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Follow a steady weekly path, complete exercises, and build math confidence step by step.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[displayGradeLabel, "Weekly Plan", `${planSummary.weekCount} Weeks`].map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200"
              >
                {chip}
              </span>
            ))}
          </div>
        </section>

        {!isStudent && (
          <div className="my-6 sm:my-8">
            <div className="flex items-center justify-center gap-6">
              <div className="hidden sm:block flex-1 h-[2px] bg-gradient-to-r from-transparent via-green-300 to-transparent" />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setGradeDropdownOpen((prev) => !prev)}
                  className="px-8 sm:px-12 py-4 sm:py-5 rounded-full bg-green-100 border-2 border-green-300 text-green-900 text-xl sm:text-3xl font-bold shadow-md hover:shadow-lg flex items-center gap-3 hover:bg-green-200 transition-all duration-200"
                >
                  {selectedGradeId
                    ? grades.find((grade) => String(grade.id) === String(selectedGradeId))?.name || "Select Grade"
                    : "All Grades"}
                  <span className="text-base sm:text-lg">⌄</span>
                </button>
                {gradeDropdownOpen && (
                  <div className="absolute z-20 mt-2 w-full min-w-[220px] rounded-2xl border border-green-200 bg-white shadow-xl py-1 overflow-hidden">
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-green-50 transition"
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
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-green-50 transition"
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
              <div className="hidden sm:block flex-1 h-[2px] bg-gradient-to-r from-transparent via-green-300 to-transparent" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={`week-skeleton-${idx}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
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
              {renderPlanDashboard()}

              {!isStudent && !selectedGradeId
                ? Object.entries(weeksByGrade).map(([gradeName, gradeWeeks]) => (
                    <div key={`weekly-grade-group-${gradeName}`} className="space-y-3">
                      <div className="mb-2 flex items-center justify-center gap-6">
                        <div className="h-[2px] w-28 rounded-full bg-green-300" />
                        <div className="whitespace-nowrap rounded-full border-2 border-green-300 bg-green-100 px-10 py-4 text-3xl font-extrabold text-green-900 shadow-md">
                          {gradeName}
                        </div>
                        <div className="h-[2px] w-28 rounded-full bg-green-300" />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {gradeWeeks.map((week) => renderWeekCard(week))}
                      </div>
                    </div>
                  ))
                : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {dedupedWeeks.map((week) => renderWeekCard(week))}
                  </div>
                )}
            </>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default WeeklyPlanPage;
