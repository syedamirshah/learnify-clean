import React, { useState, useEffect, useMemo } from "react";
import logo from "../../assets/logo.png";
import "../../App.css";
import axiosInstance from "../../utils/axiosInstance";
import { Link, useNavigate, useLocation } from "react-router-dom";
import heroBanner from "../../assets/learnify-hero.png"; // ⬅️ NEW
import AppLayout from "../../components/layout/AppLayout";
import LearningPathSelector from "../../components/layout/LearningPathSelector";
import AuthPanel from "../../components/layout/AuthPanel";
import { persistStudentGrade } from "../../utils/auth";
import { buildPublicNavItems } from "../../utils/publicNav";
import {
  buildPaymentChooseUrl,
  needsPaymentRedirect,
  paymentRedirectMessage,
} from "../../utils/paymentRedirect";
import { resolvePostLoginPath } from "../../utils/roleRoutes";
// EXPERIMENTAL: textbook view UI — revert by removing import + textbookViewExperiment.js
import {
  formatChapterSummaryMeta,
  getChapterIcon,
  getChapterLevelStatus,
  getChapterLevelStatusClass,
  getChapterProgress,
  getDailyGoalProgress,
  getExerciseStatus,
  getFirstName,
  getFiveStarFilledCount,
  getProgressTrend,
  getStarRating,
  getStudentTextbookStats,
  getTodayAverage,
  getTodayGoalMessage,
  getWelcomeMotivation,
} from "../../utils/textbookViewExperiment";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;

const LandingPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);
  const [userFullName, setFullName] = useState("");
  const [userGrade, setUserGrade] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();


const isActive = (paths = []) => {
  const p = location.pathname;
  return paths.some((x) => p === x || p.startsWith(x + "/"));
};

const navLinkClass = () =>
  "text-white hover:underline font-normal";
  const [historyMap, setHistoryMap] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);

  // NEW (presentation-only state)
  const [openGrades, setOpenGrades] = useState(new Set()); // collapsible grade bars
  const [pinnedChapterBySubject, setPinnedChapterBySubject] = useState({}); // subjectKey -> chapterKey
  const [hoverChapterBySubject, setHoverChapterBySubject] = useState({}); // subjectKey -> chapterKey

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load role and name
  useEffect(() => {
    const storedRole = localStorage.getItem("user_role");
    const storedName = localStorage.getItem("user_full_name");
    const storedGrade = localStorage.getItem("user_grade");
  
    setRole(storedRole);
    setFullName(storedName);
    setUserGrade(storedGrade);
  }, []);

    // Handle "guest=1" (from Back to Home as Guest User)
  // and payment success (?status=success from Easypay)
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const guestFlag = params.get("guest");
    const paymentStatus = params.get("payment_status") || params.get("status");

    if (guestFlag === "1" || paymentStatus === "success") {
      // 🔹 Clear all auth-related storage (force guest mode)
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_full_name");
      localStorage.removeItem("account_status");
      localStorage.removeItem("role");
      localStorage.removeItem("user_grade");
      localStorage.removeItem("user_grade_id");
      localStorage.removeItem("grade_id");

      // 🔹 Reset React state
      setRole(null);
      setFullName("");
      setUserGrade(null);

      // 🔹 Optional message
      if (paymentStatus === "success") {
        alert("Payment successful! Please login to start using Learnify.");
      }

      // 🔹 Clean URL so refresh doesn't repeat this logic
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("guest");
        url.searchParams.delete("payment_status");
        url.searchParams.delete("status");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [location.search]);

  // Expired user redirect (only if actually logged in)
    useEffect(() => {
      const status = localStorage.getItem("account_status");
      const storedRole = localStorage.getItem("user_role");
      const token = localStorage.getItem("access_token");
  
      if (
        token &&
        (storedRole === "student" || storedRole === "teacher") &&
        needsPaymentRedirect(status)
      ) {
        alert(`${paymentRedirectMessage(status)} Redirecting to payment page...`);
        window.location.href = buildPaymentChooseUrl(API);
      }
    }, []);

  // Fetch quiz data from backend and log it
  useEffect(() => {
    import("axios").then(({ default: axios }) => {
      axios
        .get(`${API}landing/quizzes/`)
        .then((res) => {
          console.log("✅ Public Quiz API Response:", res.data);
          setQuizData(res.data);
        })
        .catch((err) => console.error("❌ Error fetching quizzes:", err));
    });
  }, []);

  // ✅ NEW: fetch student quiz history (for score + grade on cards)
  useEffect(() => {
    const r = localStorage.getItem("user_role");
    const token = localStorage.getItem("access_token");

    // Only students have this history endpoint (your backend enforces it)
    if (r !== "student" || !token) return;

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);

        // axiosInstance baseURL already ends with /api/
        const res = await axiosInstance.get("student/quiz-history/");

        const results = res.data?.results || [];
        const map = {};

        results.forEach((row) => {
          const key = String(row.quiz_id); // ✅ use unique quiz_id
        
          map[key] = {
            ...row,
            total_marks: (row.total_questions || 0) * (row.marks_per_question || 0),
          };
        });

        setHistoryMap(map);
      } catch (err) {
        console.error("❌ Failed to fetch quiz history for cards:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [role]);

  // NEW: open all grades by default once data arrives (presentation-only)
  useEffect(() => {
    if (!Array.isArray(quizData) || quizData.length === 0) return;
  
    // ✅ DEFAULT EXPAND RULES (NEW)
    // Guests + Teachers -> all grades open
    // Students -> only their grade open (others collapsed)
    if (!role || role === "teacher" || role === "school_admin") {
      setOpenGrades(new Set(quizData.map((g) => g.grade)));
    } else if (role === "student") {
      const raw = localStorage.getItem("user_grade");
    
      // ✅ normalize (handles "3", "Grade 3", " grade 3 ", etc.)
      const cleaned = String(raw || "").trim().toLowerCase();
    
      // Try to match against real grade names coming from API
      const match =
        quizData.find((x) => String(x.grade || "").trim().toLowerCase() === cleaned) ||
        quizData.find((x) => String(x.grade || "").trim().toLowerCase().includes(cleaned)) ||
        quizData.find((x) => cleaned.includes(String(x.grade || "").trim().toLowerCase()));
    
      if (match?.grade) {
        setOpenGrades(new Set([match.grade])); // ✅ IMPORTANT: use API grade name
      } else {
        // fallback: keep everything collapsed
        setOpenGrades(new Set());
      }
    } else {
      setOpenGrades(new Set());
    }
  
    // ✅ default pin: first chapter of each subject (only if not already pinned)
    setPinnedChapterBySubject((prev) => {
      if (prev && Object.keys(prev).length > 0) return prev;
  
      const next = {};
  
      quizData.forEach((gradeItem) => {
        (gradeItem.subjects || []).forEach((subjectItem) => {
          const subjectKey = getSubjectKey(gradeItem.grade, subjectItem.subject);
  
          const chaptersSorted = sortedChapters(subjectItem.chapters || []);
          const firstChapter = chaptersSorted[0];
  
          if (firstChapter) {
            const chapterKey = getChapterKey(gradeItem.grade, subjectItem.subject, firstChapter);
            next[subjectKey] = chapterKey;
          }
        });
      });
  
      return next;
    });
  
    // (optional) clear hover state so pinned always wins initially
    setHoverChapterBySubject({});
  }, [quizData, role]);

  const handleLogin = async () => {
    try {
      const res = await axiosInstance.post("token/", { username, password });

      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      localStorage.setItem("account_status", res.data.account_status);
      localStorage.setItem("role", res.data.role);

      const me = await axiosInstance.get("user/me/");
      const role = me.data.role;
      const fullName = me.data.full_name || me.data.username;
      const status = me.data.account_status;

      // ✅ Store student grade + grade_id for grade-restricted pages
      const persistedGradeId = persistStudentGrade(me.data);
      const studentGradeName =
        me.data.grade_name ||
        me.data.grade?.name ||
        me.data.grade ||
        "";
      if (studentGradeName) setUserGrade(studentGradeName);
      if (persistedGradeId && !studentGradeName) {
        // keep state in sync even if only numeric id is returned
        setUserGrade(localStorage.getItem("user_grade") || null);
      }

      if (role === "admin" || role === "manager") {
        alert("Admins and Managers must login from the backend.");
        return;
      }

      localStorage.setItem("user_role", role);
      localStorage.setItem("user_full_name", fullName);
      localStorage.setItem("account_status", status);
      if (me.data.username) localStorage.setItem("username", me.data.username);
      setRole(role);
      setFullName(fullName);

      if ((role === "student" || role === "teacher") && needsPaymentRedirect(status)) {
        alert(paymentRedirectMessage(status));
        window.location.href = buildPaymentChooseUrl(API, username);
      } else {
        navigate(resolvePostLoginPath(role, location.search));
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        alert("Login failed: " + err.response.data.detail);
      } else {
        alert("Login failed: Server error");
      }
      console.error("Login error:", err);
    }
  };

  const handleLogout = () => {
    // 🔹 Clear authentication
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  
    // 🔹 Clear user identity
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_full_name");
    localStorage.removeItem("account_status");
    localStorage.removeItem("role");
  
    // 🔹 ✅ CLEAR STUDENT GRADE (THIS IS STEP 3)
    localStorage.removeItem("user_grade");
    localStorage.removeItem("user_grade_id");
    localStorage.removeItem("grade_id");
  
    // 🔹 Reset React state
    setRole(null);
    setFullName("");
    setUserGrade(null); // ✅ IMPORTANT
  
    // 🔹 Redirect cleanly
    navigate("/learn", { replace: true });
  };
  
  // ====== existing helpers (unchanged, kept as-is even if not used) ======
  const chapterWeight = (ch) =>
    1 + (Array.isArray(ch.quizzes) ? ch.quizzes.length : 0);

  const splitChaptersBalanced = (chapters, cols = 3) => {
    const total = chapters.reduce((s, ch) => s + chapterWeight(ch), 0);
    const target = Math.ceil(total / cols);

    const out = Array.from({ length: cols }, () => []);
    let col = 0;
    let used = 0;

    chapters.forEach((ch, i) => {
      const w = chapterWeight(ch);
      const remainingChapters = chapters.length - i - 1;
      const remainingCols = cols - col - 1;

      if (used > 0 && used + w > target && remainingCols >= 1) {
        col += 1;
        used = 0;
      }
      out[col].push(ch);
      used += w;
    });

    return out;
  };

  const chapterCardTints = [
    "bg-gray-100",
    "bg-green-100",
    "bg-blue-100",
    "bg-yellow-100",
    "bg-pink-100",
    "bg-purple-100",
    "bg-teal-100",
    "bg-orange-100",
  ];

  // NEW helpers (presentation-only)
  const toggleGrade = (gradeName) => {
    setOpenGrades((prev) => {
      const next = new Set(prev);
      if (next.has(gradeName)) next.delete(gradeName);
      else next.add(gradeName);
      return next;
    });
  };

  const getSubjectKey = (gradeName, subjectName) => `${gradeName}__${subjectName}`;

  // ✅ chapterKey must be STABLE, but also UNIQUE enough to avoid collisions
  // We use chapterName + a fallback id if backend gives one.
  const getChapterKey = (gradeName, subjectName, chapterObjOrName) => {
    // allow passing either chapter string OR full chapter object
    const chapterName =
      typeof chapterObjOrName === "string"
        ? chapterObjOrName
        : chapterObjOrName?.chapter;

    const chapterId =
      typeof chapterObjOrName === "object" ? chapterObjOrName?.id : null;

    const safeName = String(chapterName || "").trim();
    return `${gradeName}__${subjectName}__${safeName}__${chapterId ?? "noid"}`;
  };

  const activeChapterKeyForSubject = (subjectKey) =>
    pinnedChapterBySubject[subjectKey] || hoverChapterBySubject[subjectKey] || null;

  const sortedQuizzes = (quizzes) => {
    return [...(quizzes || [])].sort((a, b) => {
      const numA = parseInt((a.title || "").trim().match(/^\d+/)?.[0] ?? "999999", 10);
      const numB = parseInt((b.title || "").trim().match(/^\d+/)?.[0] ?? "999999", 10);
      if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) return numA - numB;
      return (a.title || "").localeCompare(b.title || "");
    });
  };

  const sortedChapters = (chapters) => {
    return [...(chapters || [])].sort((a, b) => {
      const getNum = (txt) => {
        const m = String(txt || "").match(/Chapter\s*(\d+)/i);
        return m ? parseInt(m[1], 10) : 999999;
      };
      return getNum(a.chapter) - getNum(b.chapter);
    });
  };

    // --- helpers to show only the student's own grade on landing page ---
    const normalizeGradeLabel = (val) =>
      String(val || "").trim().toLowerCase();
  
    const getVisibleQuizData = () => {
      // Guests + teachers: see all grades
      if (role !== "student") return quizData;
  
      if (!Array.isArray(quizData) || quizData.length === 0) return [];
  
      // Take grade from state (preferred) or localStorage as fallback
      const stored = userGrade || localStorage.getItem("user_grade");
      const cleaned = normalizeGradeLabel(stored);
  
      // If we somehow don't know the grade, fall back to showing all
      if (!cleaned) return quizData;
  
      // Try to match student's grade against API grade labels
      const match =
        quizData.find((x) => normalizeGradeLabel(x.grade) === cleaned) ||
        quizData.find((x) =>
          normalizeGradeLabel(x.grade).includes(cleaned)
        ) ||
        quizData.find((x) =>
          cleaned.includes(normalizeGradeLabel(x.grade))
        );
  
      // If we found a match, only show that one grade; otherwise show all
      return match ? [match] : quizData;
    };

  // ✅ NEW: normalize quiz titles so matching is reliable
  const normalizeTitle = (t) => String(t || "").trim();

  
  // 🎨 Chapter colors + matching light quiz card tones (inheritance when chapter selected)
const chapterPalettes = [
  {
    cardBg: "bg-sky-400",
    cardBorder: "border-sky-600",
    titleText: "text-white",
    panelBg: "bg-sky-100",
    panelBorder: "border-sky-200",
    accent: "text-sky-900",
    quizCardBg: "bg-sky-50",
    quizCardBorder: "border-sky-200",
  },
  {
    cardBg: "bg-emerald-400",
    cardBorder: "border-emerald-600",
    titleText: "text-white",
    panelBg: "bg-emerald-100",
    panelBorder: "border-emerald-200",
    accent: "text-emerald-900",
    quizCardBg: "bg-emerald-50",
    quizCardBorder: "border-emerald-200",
  },
  {
    cardBg: "bg-teal-400",
    cardBorder: "border-teal-600",
    titleText: "text-white",
    panelBg: "bg-teal-100",
    panelBorder: "border-teal-200",
    accent: "text-teal-900",
    quizCardBg: "bg-teal-50",
    quizCardBorder: "border-teal-200",
  },
  {
    cardBg: "bg-lime-400",
    cardBorder: "border-lime-600",
    titleText: "text-white",
    panelBg: "bg-lime-100",
    panelBorder: "border-lime-200",
    accent: "text-lime-900",
    quizCardBg: "bg-lime-50",
    quizCardBorder: "border-lime-200",
  },
  {
    cardBg: "bg-amber-400",
    cardBorder: "border-amber-600",
    titleText: "text-white",
    panelBg: "bg-amber-100",
    panelBorder: "border-amber-200",
    accent: "text-amber-900",
    quizCardBg: "bg-amber-50",
    quizCardBorder: "border-amber-200",
  },
  {
    cardBg: "bg-rose-400",
    cardBorder: "border-rose-600",
    titleText: "text-white",
    panelBg: "bg-rose-100",
    panelBorder: "border-rose-200",
    accent: "text-rose-900",
    quizCardBg: "bg-pink-50",
    quizCardBorder: "border-pink-200",
  },
  {
    cardBg: "bg-indigo-400",
    cardBorder: "border-indigo-600",
    titleText: "text-white",
    panelBg: "bg-indigo-100",
    panelBorder: "border-indigo-200",
    accent: "text-indigo-900",
    quizCardBg: "bg-violet-50",
    quizCardBorder: "border-violet-200",
  },
  {
    cardBg: "bg-fuchsia-400",
    cardBorder: "border-fuchsia-600",
    titleText: "text-white",
    panelBg: "bg-fuchsia-100",
    panelBorder: "border-fuchsia-200",
    accent: "text-fuchsia-900",
    quizCardBg: "bg-fuchsia-50",
    quizCardBorder: "border-fuchsia-200",
  },
];

  const getChapterPalette = (i) => chapterPalettes[i % chapterPalettes.length];

  const brandTitle = "Learnify Pakistan";
  const brandMotto = "Practicing Math Responsibly";
  const navItems = useMemo(
    () =>
      buildPublicNavItems(role, {
        includePaymentInSignup: true,
        paymentChooseUrl: buildPaymentChooseUrl(API),
      }),
    [role]
  );

  const visibleQuizData = useMemo(() => getVisibleQuizData(), [role, quizData, userGrade]);

  const studentTextbookStats = useMemo(() => {
    if (role !== "student") return null;
    return getStudentTextbookStats(visibleQuizData, historyMap);
  }, [role, visibleQuizData, historyMap]);

  const studentDailyGoal = useMemo(() => {
    if (role !== "student" || !studentTextbookStats) return null;
    return getDailyGoalProgress(historyMap, studentTextbookStats);
  }, [role, historyMap, studentTextbookStats]);

  const studentTodayAverage = useMemo(() => {
    if (role !== "student") return null;
    return getTodayAverage(historyMap);
  }, [role, historyMap]);

  const studentProgressTrend = useMemo(() => {
    if (role !== "student") return null;
    return getProgressTrend(historyMap);
  }, [role, historyMap]);

  const studentFirstName = useMemo(() => getFirstName(userFullName), [userFullName]);

  const renderFiveStarRating = (average) => {
    const filled = getFiveStarFilledCount(average);
    return (
      <div
        className="mt-1 flex gap-0.5"
        role="img"
        aria-label={`${filled} out of 5 stars based on average score`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`text-xl leading-none ${i <= filled ? "text-amber-400" : "text-gray-300"}`}
            aria-hidden="true"
          >
            {i <= filled ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      logoHref="/learn"
      brandTitle={brandTitle}
      brandMotto={brandMotto}
      isAuthenticated={Boolean(role)}
      userFullName={userFullName}
      username={username}
      password={password}
      remember={rememberMe}
      navItems={navItems}
      isMobileDrawerOpen={mobileDrawerOpen}
      onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
      onUsernameChange={(e) => setUsername(e.target.value)}
      onPasswordChange={(e) => setPassword(e.target.value)}
      onRememberChange={(e) => setRememberMe(e.target.checked)}
      onSignInClick={handleLogin}
      onLogoutClick={handleLogout}
      mobileAuthContent={
        role ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Logout
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMobileAuthOpen((prev) => !prev)}
            className="rounded-md bg-[#42b72a] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Sign in
          </button>
        )
      }
    >
      {!role && mobileAuthOpen && (
        <div className="md:hidden">
          <div className="mx-auto w-full max-w-[1200px] px-3 pt-2 sm:px-4">
            <div className="rounded-xl border border-green-200 bg-white p-3 shadow-sm">
              <AuthPanel
                isAuthenticated={false}
                username={username}
                password={password}
                remember={rememberMe}
                onUsernameChange={(e) => setUsername(e.target.value)}
                onPasswordChange={(e) => setPassword(e.target.value)}
                onRememberChange={(e) => setRememberMe(e.target.checked)}
                onSignInClick={handleLogin}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section (full width) */}
      <section className="w-full">
        <div className="w-full h-[220px] sm:h-[280px] overflow-hidden bg-white md:h-[520px]">
          <img
            src={heroBanner}
            alt="Learnify Pakistan Hero Banner"
            loading="eager"
            fetchPriority="high"
            width={1536}
            height={586}
            className="w-full h-full object-contain md:object-cover object-center block"
          />
        </div>
      </section>

      <LearningPathSelector activePath="textbook" />
        {/* Content Explorer — default Textbook View (chapter-based layout) */}
        <div id="textbook-view" className="mx-auto mt-6 max-w-[1400px] px-3 md:px-4">
          {role === "student" && (
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <section className="flex min-h-[220px] flex-col rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500 p-5 text-white shadow-lg md:p-6">
                <p className="text-sm font-bold">👋 Welcome Back</p>
                <h2 className="mt-2 text-2xl font-black">Hi, {studentFirstName}!</h2>
                {!historyLoading &&
                  renderFiveStarRating(studentTextbookStats?.average ?? null)}
                {historyLoading && (
                  <p className="mt-2 text-sm text-emerald-100">Loading your progress…</p>
                )}
                <div className="mt-4 space-y-1 text-sm">
                  <p>
                    <span className="text-emerald-100">Exercises Completed:</span>{" "}
                    <span className="font-bold">
                      {historyLoading ? "…" : studentTextbookStats?.completed ?? 0}
                    </span>
                  </p>
                  <p>
                    <span className="text-emerald-100">Average Score:</span>{" "}
                    <span className="font-bold">
                      {historyLoading
                        ? "…"
                        : studentTextbookStats?.average !== null
                          ? `${studentTextbookStats.average}%`
                          : "—"}
                    </span>
                  </p>
                </div>
                <p className="mt-auto pt-4 text-sm font-medium text-emerald-50">
                  {getWelcomeMotivation(studentDailyGoal, studentTextbookStats)}
                </p>
              </section>

              {studentDailyGoal && (
                <section className="flex min-h-[220px] flex-col rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 shadow-lg md:p-6">
                  <p className="text-sm font-bold text-sky-900">🎯 Today&apos;s Goal</p>
                  {studentDailyGoal.completed ? (
                    <p className="mt-4 text-xl font-black text-emerald-800">
                      🎉 {getTodayGoalMessage(studentDailyGoal)}
                    </p>
                  ) : (
                    <>
                      <p className="mt-3 text-lg font-bold text-gray-800">
                        {studentDailyGoal.progress} / {studentDailyGoal.target} exercises
                        completed
                      </p>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-sky-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (studentDailyGoal.progress / studentDailyGoal.target) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      {studentTodayAverage !== null && (
                        <p className="mt-3 text-sm text-gray-700">
                          <span className="font-semibold">Today&apos;s Average:</span>{" "}
                          {studentTodayAverage}%
                        </p>
                      )}
                    </>
                  )}
                  <p className="mt-auto pt-4 text-sm font-medium text-gray-600">
                    {getTodayGoalMessage(studentDailyGoal)}
                  </p>
                </section>
              )}

              {studentProgressTrend && (
                <section className="flex min-h-[220px] flex-col rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 shadow-lg md:p-6">
                  <p className="text-sm font-bold text-violet-900">📈 Progress Trend</p>
                  {studentProgressTrend.hasData ? (
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                      <p>
                        <span className="font-semibold">Recent:</span>{" "}
                        {studentProgressTrend.recentAverage}%
                      </p>
                      <p>
                        <span className="font-semibold">Previous:</span>{" "}
                        {studentProgressTrend.previousAverage}%
                      </p>
                      <p className="text-lg font-black text-violet-950">
                        {studentProgressTrend.trend}{" "}
                        <span aria-hidden="true">{studentProgressTrend.arrow}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-relaxed text-gray-600">
                      {studentProgressTrend.message}
                    </p>
                  )}
                </section>
              )}
            </div>
          )}

          {visibleQuizData.map((gradeItem, gradeIndex) => {
          const gradeOpen = openGrades.has(gradeItem.grade);

          return (
            <div key={`grade-${gradeIndex}`} className="mb-12">
              {/* ✅ Grade itself is the toggle (no extra expand/collapse button) */}
              {/* ===== Grade Header ===== */}
                <div className="flex items-center justify-center gap-6 mt-4 mb-6">
                  {/* Left line (longer than subject) */}
                  <div className="h-[2px] w-28 bg-green-300 rounded-full" />

                  {/* Grade Button */}
                  <button
                    type="button"
                    onClick={() => toggleGrade(gradeItem.grade)}
                    className="
                      flex items-center justify-center gap-3 whitespace-nowrap
                      px-10 py-4
                      rounded-full
                      border-2 border-green-300
                      bg-green-100
                      shadow-md
                      hover:shadow-lg
                      transition
                      text-3xl
                      font-extrabold
                      text-green-900
                    "
                  >
                    {gradeItem.grade}
                    <span className="text-xl">▾</span>
                  </button>

                  {/* Right line */}
                  <div className="h-[2px] w-28 bg-green-300 rounded-full" />
                </div>

              {!gradeOpen ? null : (
                <div className="mt-4 space-y-6">
                  {gradeItem.subjects.map((subjectItem, subjectIndex) => {
                    // ✅ Keep sorting + attach a stable UI color index
                    const chaptersSorted = sortedChapters(subjectItem.chapters).map((ch, idxSorted) => ({
                      ...ch,
                      _colorIndex: idxSorted, // UI-only
                    }));

                    const subjectKey = getSubjectKey(gradeItem.grade, subjectItem.subject);
                    const activeKey = activeChapterKeyForSubject(subjectKey);

                    // ✅ Build map using the SAME stable chapterKey (NO idx)
                    const chapterIndexMap = (() => {
                      const map = new Map();
                      (chaptersSorted || []).forEach((ch) => {
                        const ck = getChapterKey(gradeItem.grade, subjectItem.subject, ch);
                        map.set(ck, ch);
                      });
                      return map;
                    })();

                    const activeChapterObj =
                      activeKey && chapterIndexMap.has(activeKey) ? chapterIndexMap.get(activeKey) : null;

                    const activePalette =
                      activeChapterObj ? getChapterPalette(activeChapterObj._colorIndex ?? 0) : null;

                    const activeQuizzesForSubject = activeChapterObj
                      ? sortedQuizzes(activeChapterObj.quizzes)
                      : [];

                    return (
                      <section key={`subject-${gradeIndex}-${subjectIndex}`} className="space-y-4">
                        {/*
                          ✅ Subject heading hidden temporarily because Learnify is now math-exclusive
                        <div className="flex justify-center">
                          <div className="flex items-center gap-4">
                            <span className="hidden md:block h-[2px] w-24 bg-green-200 rounded-full" />
                            <div className="px-6 py-2 rounded-full bg-green-50 border border-green-200 shadow-sm
                                            text-3xl font-extrabold text-green-900">
                              {subjectItem.subject}
                            </div>
                            <span className="hidden md:block h-[2px] w-24 bg-green-200 rounded-full" />
                          </div>
                        </div>
                        */}
                        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[400px_1fr]">
                          {/* LEFT: Chapter levels (inherits active chapter light palette) */}
                            <div
                              className={`overflow-hidden rounded-3xl shadow-md ring-1 ${
                                activePalette
                                  ? `${activePalette.quizCardBg} ${activePalette.panelBorder}`
                                  : "bg-white ring-emerald-100"
                              }`}
                            >
                              <div
                                className={`border-b px-4 py-3 ${
                                  activePalette
                                    ? `${activePalette.panelBg} ${activePalette.panelBorder}`
                                    : "border-emerald-50 bg-emerald-50/50"
                                }`}
                              >
                                <div
                                  className={`text-lg font-black ${
                                    activePalette ? activePalette.accent : "text-emerald-950"
                                  }`}
                                >
                                  Chapter Levels
                                </div>
                              </div>

                              <div className="p-4">
                                <div className="space-y-2">
                                  {chaptersSorted.map((chapterItem, idx) => {
                                    const chapterKey = getChapterKey(
                                      gradeItem.grade,
                                      subjectItem.subject,
                                      chapterItem
                                    );

                                    const pinned = pinnedChapterBySubject[subjectKey] === chapterKey;
                                    const palette = getChapterPalette(chapterItem._colorIndex ?? idx);
                                    const chapterProgress = getChapterProgress(
                                      chapterItem.quizzes,
                                      role === "student" ? historyMap : {}
                                    );
                                    const chapterIcon = getChapterIcon(chapterItem.chapter);
                                    const levelStatus = getChapterLevelStatus(chapterProgress);

                                    return (
                                      <button
                                        key={`chapter-row-${chapterKey}`}
                                        type="button"
                                        onMouseEnter={() => {
                                          setHoverChapterBySubject((prev) => ({
                                            ...prev,
                                            [subjectKey]: chapterKey,
                                          }));
                                        }}
                                        onMouseLeave={() => {
                                          setHoverChapterBySubject((prev) => {
                                            if (pinnedChapterBySubject[subjectKey]) return prev;
                                            const next = { ...prev };
                                            delete next[subjectKey];
                                            return next;
                                          });
                                        }}
                                        onClick={() => {
                                          setPinnedChapterBySubject((prev) => {
                                            const currentlyPinned = prev[subjectKey];
                                            if (currentlyPinned === chapterKey) {
                                              const next = { ...prev };
                                              delete next[subjectKey];
                                              return next;
                                            }
                                            return { ...prev, [subjectKey]: chapterKey };
                                          });
                                        }}
                                        className={`w-full rounded-2xl p-3 text-left shadow-sm ring-1 transition duration-200
                                          ${palette.cardBg} ring-black/10
                                          ${pinned ? "ring-2 ring-emerald-400 ring-offset-1" : "hover:-translate-y-0.5 hover:shadow-md"}
                                        `}
                                        title="Hover to preview exercises • Click to keep exercises open"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div
                                            className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border-2 bg-white/85
                                              ${palette.cardBorder} text-gray-900
                                            `}
                                          >
                                            <span className="text-lg leading-none" aria-hidden="true">
                                              {chapterIcon}
                                            </span>
                                            <span className="mt-0.5 text-[10px] font-extrabold">{idx + 1}</span>
                                          </div>

                                          <div className="min-w-0 flex-1">
                                            <div className={`truncate text-[17px] font-semibold md:text-[19px] ${palette.titleText} drop-shadow-[0_0.5px_0_rgba(0,0,0,0.30)]`}>
                                              {chapterItem.chapter}
                                            </div>
                                            <div className="mt-1 text-sm font-bold text-white/95">
                                              {chapterProgress.attempted} / {chapterProgress.total}
                                            </div>
                                            {chapterProgress.total > 0 && (
                                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20">
                                                <div
                                                  className="h-full rounded-full bg-white transition-all"
                                                  style={{
                                                    width: `${chapterProgress.progressPercent}%`,
                                                  }}
                                                />
                                              </div>
                                            )}
                                            <span
                                              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${getChapterLevelStatusClass(levelStatus.tone)}`}
                                            >
                                              {levelStatus.label}
                                            </span>
                                          </div>

                                          <div className="shrink-0 pt-1 text-lg text-white/90">
                                            {pinned ? "📌" : "›"}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          {/* RIGHT: Exercises (colors inherit active chapter) */}
                          <div
                            className={`min-w-0 overflow-hidden rounded-3xl bg-white shadow-md ring-1 ${
                              activePalette ? activePalette.panelBorder : "ring-emerald-100"
                            }`}
                          >
                            <div
                              className={`border-b px-4 py-3 ${
                                activePalette
                                  ? `${activePalette.panelBg} ${activePalette.panelBorder}`
                                  : "border-emerald-50 bg-emerald-50/40"
                              }`}
                            >
                              <div
                                className={`text-lg font-black ${
                                  activePalette ? activePalette.accent : "text-emerald-950"
                                }`}
                              >
                                Exercises
                              </div>
                            </div>

                            <div className="p-4 md:p-5">
                              {!activeChapterObj ? (
                                <div className="py-12 text-center text-gray-500">
                                  Select a chapter to view exercises.
                                </div>
                              ) : (
                                (() => {
                                  const activeQuizzes = activeQuizzesForSubject;
                                  const activeProgress = getChapterProgress(
                                    activeChapterObj.quizzes,
                                    role === "student" ? historyMap : {}
                                  );
                                  const chapterMeta = formatChapterSummaryMeta(activeProgress);
                                  const activeChapterIcon = getChapterIcon(activeChapterObj.chapter);

                                  return (
                                    <div className="space-y-3">
                                      <div>
                                        <div
                                          className={`flex items-center gap-2 text-lg font-black ${
                                            activePalette ? activePalette.accent : "text-emerald-950"
                                          }`}
                                        >
                                          <span aria-hidden="true">{activeChapterIcon}</span>
                                          <span>{activeChapterObj.chapter}</span>
                                        </div>
                                        {chapterMeta && (
                                          <p className="mt-0.5 text-[11px] text-gray-400">{chapterMeta}</p>
                                        )}
                                      </div>

                                      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
                                        {activeQuizzes.map((quiz) => {
                                          const history = historyMap[String(quiz.id)];
                                          const pct =
                                            history?.percentage !== undefined &&
                                            history?.percentage !== null
                                              ? Number(history.percentage)
                                              : null;
                                          const status = getExerciseStatus(
                                            role === "student" ? pct : null
                                          );
                                          const stars = getStarRating(
                                            role === "student" ? pct : null
                                          );

                                          const quizCardClass = activePalette
                                            ? `border-2 ${activePalette.quizCardBg} ${activePalette.quizCardBorder} hover:shadow-md`
                                            : `border-2 border-gray-200 bg-white ${status.cardAccent}`;

                                          return (
                                            <Link
                                              key={`quiz-${quiz.id}`}
                                              to={`/student/attempt-quiz/${quiz.id}`}
                                              className={`group block rounded-2xl px-4 py-3 transition duration-200 hover:-translate-y-0.5 ${quizCardClass}`}
                                            >
                                              <div className="flex items-start justify-between gap-2">
                                                {role === "student" && (
                                                  <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${status.badgeClass}`}
                                                  >
                                                    <span aria-hidden="true">{status.icon}</span>
                                                    {status.label}
                                                  </span>
                                                )}
                                                {role === "student" && stars.count > 0 && (
                                                  <span
                                                    className="text-lg leading-none"
                                                    aria-label={stars.label}
                                                  >
                                                    {stars.stars}
                                                  </span>
                                                )}
                                              </div>

                                              <div
                                                className={`mt-2 font-semibold leading-snug ${
                                                  activePalette ? activePalette.accent : "text-emerald-950"
                                                }`}
                                              >
                                                {quiz.title}
                                              </div>

                                              {role === "student" && history && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                  <span className="font-semibold text-gray-700">
                                                    {history.percentage}%
                                                  </span>{" "}
                                                  · {history.marks_obtained}/{history.total_marks}
                                                </p>
                                              )}

                                              {role === "student" && (
                                                <p className="mt-3 text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                                                  {status.cta} →
                                                </p>
                                              )}

                                              {role === "student" && !history && historyLoading && (
                                                <p className="mt-2 text-[11px] text-gray-400">
                                                  Loading…
                                                </p>
                                              )}
                                            </Link>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()
                              )}
                            </div>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Footer */}
      <footer className="mt-16 border-t bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-600">
          <div>
            © {new Date().getFullYear()} Learnify Pakistan
          </div>

          <div className="flex items-center gap-4">
            <Link to="/help-center" className="text-gray-700 hover:underline">
              Help Center
            </Link>
            <a
              href="mailto:support@learnifypakistan.com"
              className="text-gray-700 hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </AppLayout>
  );
};

export default LandingPage;
