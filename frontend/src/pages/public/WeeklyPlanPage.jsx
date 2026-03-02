import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import { clearAuth, getAuthSnapshot, hydrateStudentGradeIdFromProfile } from "../../utils/auth";
import { buildPublicNavItems } from "../../utils/publicNav";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;

const groupBySubject = (quizzes = []) => {
  const groups = {};
  quizzes.forEach((q) => {
    const subject = q?.subject?.name || "General";
    if (!groups[subject]) groups[subject] = [];
    groups[subject].push(q);
  });
  return groups;
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
        const includeQuizzes = Boolean(effectiveGradeId);

        params.set("include_quizzes", includeQuizzes ? "1" : "0");
        if (effectiveGradeId) params.set("grade", effectiveGradeId);

        const res = await fetch(`${API}landing/weeks/?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to fetch weeks (${res.status})`);
        const data = await res.json();
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-green-900">Weekly Plan</h1>
          <p className="mt-1 text-sm text-gray-600">Browse quizzes grouped week-wise and follow your learning sequence.</p>
        </header>

        {!isStudent && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <label htmlFor="weekly-grade" className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Grade
            </label>
            <select
              id="weekly-grade"
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
          {isStudent && !gradeId && auth.accessToken && (hydrating || !hydrationChecked) ? (
            <div className="text-center py-10 text-gray-500">Loading your learning path...</div>
          ) : isStudent && !gradeId && auth.accessToken && hydrationChecked ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
              Your grade is not set. Please contact admin.
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">Loading weeks...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
          ) : weeks.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">No weeks created yet.</div>
          ) : (
            weeks.map((week) => (
              <article key={week.id} className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{week.name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{week.grade?.name || "Unknown Grade"}</p>
                    {week.progress_percent !== null && week.progress_percent !== undefined && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">{week.completed_quizzes} / {week.total_quizzes} completed</p>
                        <div className="mt-1 h-2 w-full rounded bg-gray-200">
                          <div className="h-2 rounded bg-green-500" style={{ width: `${week.progress_percent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    {week.quiz_count || 0} quizzes
                  </span>
                </div>

                {Array.isArray(week.quizzes) && (
                  <div className="mt-3 space-y-2">
                    {week.quizzes.length === 0 ? (
                      <p className="text-xs text-gray-500">No quizzes assigned yet.</p>
                    ) : (
                      Object.entries(groupBySubject(week.quizzes)).map(([subjectName, quizzes]) => (
                        <div key={`week-subject-${week.id}-${subjectName}`} className="mt-3">
                          <h3 className="mb-1 text-sm font-semibold text-green-800">{subjectName}</h3>
                          <div className="space-y-2">
                            {quizzes.map((quiz, index) => (
                              <div
                                key={`week-quiz-${week.id}-${quiz.id}`}
                                className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-gray-800">Lesson {index + 1}: {quiz.title}</p>
                                  <p className="truncate text-[11px] text-gray-500">
                                    {quiz.subject?.name || "—"} • {quiz.chapter?.name || "—"}
                                  </p>
                                </div>
                                <Link
                                  to={`/student/attempt-quiz/${quiz.id}`}
                                  className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                                >
                                  Attempt
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default WeeklyPlanPage;
