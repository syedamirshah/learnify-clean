import React, { useState, useEffect } from "react";
import logo from "../../assets/logo.png";
import "../../App.css";
import axiosInstance from "../../utils/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import heroBanner from "../../assets/learnify-hero.png"; // ⬅️ NEW

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;

const LandingPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);
  const [userFullName, setFullName] = useState("");
  const [quizData, setQuizData] = useState([]);
  const navigate = useNavigate();
  const [historyMap, setHistoryMap] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);

  // NEW (presentation-only state)
  const [openGrades, setOpenGrades] = useState(new Set()); // collapsible grade bars
  const [pinnedChapterBySubject, setPinnedChapterBySubject] = useState({}); // subjectKey -> chapterKey
  const [hoverChapterBySubject, setHoverChapterBySubject] = useState({}); // subjectKey -> chapterKey

  
  // Load role and name
  useEffect(() => {
    const storedRole = localStorage.getItem("user_role");
    const storedName = localStorage.getItem("user_full_name");
    setRole(storedRole);
    setFullName(storedName);
  }, []);

  // Expired user redirect
  useEffect(() => {
    const status = localStorage.getItem("account_status");
    const role = localStorage.getItem("user_role");
    if ((role === "student" || role === "teacher") && status === "expired") {
      alert("Your subscription has expired. Redirecting to payment page...");
      window.location.href = `${API}payments/choose/`;
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
          // ✅ Use quiz_id (or row.quiz if that's what backend sends)
          const key = String(row.quiz_id ?? row.quiz);
        
          if (!key) return; // safety
        
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
  
    // open all grades by default
    setOpenGrades(new Set(quizData.map((g) => g.grade)));
  
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
  }, [quizData]);

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

      if (role === "admin" || role === "manager") {
        alert("Admins and Managers must login from the backend.");
        return;
      }

      localStorage.setItem("user_role", role);
      localStorage.setItem("user_full_name", fullName);
      localStorage.setItem("account_status", status);
      setRole(role);
      setFullName(fullName);

      if ((role === "student" || role === "teacher") && status === "expired") {
        window.location.href = `${API}payments/choose/`;
      } else {
        navigate("/");
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
    // Clear ALL auth keys (you currently leave "role" behind)
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_full_name");
    localStorage.removeItem("account_status");
    localStorage.removeItem("role"); // ✅ important (you set this on login)
  
    // Reset UI state
    setRole(null);
    setFullName("");
  
    // ✅ No hard refresh. Also blocks back-navigation to old page.
    navigate("/", { replace: true });
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

  // ✅ NEW: normalize quiz titles so matching is reliable
  const normalizeTitle = (t) => String(t || "").trim();

  
  // 🎨 Bright (full tone) chapter colors for cards
const chapterPalettes = [
  // 1️⃣ Calm & learning-friendly (best for first chapters)
  { cardBg: "bg-sky-400",     cardBorder: "border-sky-600",     titleText: "text-white", panelBg: "bg-sky-100",     panelBorder: "border-sky-200",     accent: "text-sky-900" },
  { cardBg: "bg-emerald-400", cardBorder: "border-emerald-600", titleText: "text-white", panelBg: "bg-emerald-100", panelBorder: "border-emerald-200", accent: "text-emerald-900" },
  { cardBg: "bg-teal-400",    cardBorder: "border-teal-600",    titleText: "text-white", panelBg: "bg-teal-100",    panelBorder: "border-teal-200",    accent: "text-teal-900" },

  // 2️⃣ Friendly warm energy (middle chapters)
  { cardBg: "bg-lime-400",    cardBorder: "border-lime-600",    titleText: "text-white", panelBg: "bg-lime-100",    panelBorder: "border-lime-200",    accent: "text-lime-900" },
  { cardBg: "bg-amber-400",   cardBorder: "border-amber-600",   titleText: "text-white", panelBg: "bg-amber-100",   panelBorder: "border-amber-200",   accent: "text-amber-900" },
  { cardBg: "bg-rose-400",    cardBorder: "border-rose-600",    titleText: "text-white", panelBg: "bg-rose-100",    panelBorder: "border-rose-200",    accent: "text-rose-900" },

  // 3️⃣ Special / advanced / highlight chapters
  { cardBg: "bg-indigo-400",  cardBorder: "border-indigo-600",  titleText: "text-white", panelBg: "bg-indigo-100",  panelBorder: "border-indigo-200",  accent: "text-indigo-900" },
  { cardBg: "bg-fuchsia-400", cardBorder: "border-fuchsia-600", titleText: "text-white", panelBg: "bg-fuchsia-100", panelBorder: "border-fuchsia-200", accent: "text-fuchsia-900" },
];

  const getChapterPalette = (i) => chapterPalettes[i % chapterPalettes.length];

  const brandTitle = "Learnify Pakistan";
  const brandMotto = "Learning with Responsibility";

  return (
    <div className="min-h-screen font-[Nunito] text-gray-800 bg-white">
      {/* Header (same before/after login, with requested layout) */}
      <header className="px-6 md:px-10 pt-4 pb-2">
        {/* ✅ Wrapper to reduce extreme left/right without centering everything */}
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          {/* Left: logo + brand + motto */}
          <div className="flex items-center gap-4 min-w-0">
          <img
              src={logo}
              alt="Learnify Pakistan Logo"
              className="h-20 md:h-24 -ml-2 md:-ml-4"
            />
            <div className="min-w-0">
              <div className="text-xl md:text-2xl font-extrabold text-green-900 leading-tight">
                {brandTitle}
              </div>
              <div className="text-sm md:text-base font-semibold italic text-green-800 leading-tight">
                {brandMotto}
              </div>
            </div>
          </div>
  
          {/* Right: user name near logout OR login form (logic unchanged) */}
          <div className="flex items-center gap-3">
            {role ? (
              <>
                {userFullName && (
                  <span className="hidden sm:inline text-base md:text-lg font-semibold text-gray-700 italic">
                    Welcome, {userFullName}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 ml-3 md:ml-5"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="px-3 py-1 border rounded w-28 md:w-40"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-3 py-1 border rounded w-28 md:w-40"
                />
                <button
                  onClick={handleLogin}
                  className="bg-[#42b72a] text-white px-4 py-1 rounded hover:bg-green-700"
                >
                  Sign in
                </button>
                <label className="ml-1 text-sm hidden md:inline">
                  <input type="checkbox" className="mr-1" /> Remember
                </label>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Navbar */}
      <nav
        className="w-full bg-[#42b72a] text-white
                  flex justify-evenly items-center text-center
                  text-xl font-normal
                  py-2 px-6 md:px-10"
      >
        <div>
          <Link to="/why-join" className="text-white hover:underline">
            Why Join Learnify?
          </Link>
        </div>

        <div className="relative group">
          {role === "student" && (
            <>
              <button className="text-white hover:underline font-normal">
                Assessment
              </button>
              <div className="absolute left-0 top-full hidden group-hover:block z-50 pt-2">
                <div className="w-60 flex flex-col bg-white text-black shadow-lg rounded text-lg">
                  <Link to="/student/assessment" className="px-4 py-2 hover:bg-gray-100">
                    Subject-wise Performance
                  </Link>
                  <Link to="/student/quiz-history" className="px-4 py-2 hover:bg-gray-100">
                    Quiz History
                  </Link>
                  <Link to="/student/tasks" className="px-4 py-2 hover:bg-gray-100">
                    Tasks
                  </Link>
                </div>
              </div>
            </>
          )}

          {role === "teacher" && (
            <>
              <button className="text-white hover:underline font-normal">
                Assessment
              </button>

              <div className="absolute left-0 top-full hidden group-hover:block z-50 pt-2">
                <div className="w-60 flex flex-col bg-white text-black shadow-lg rounded text-lg">
                  <Link to="/teacher/assessment" className="px-4 py-2 hover:bg-gray-100">
                    Student Results
                  </Link>

                  <Link to="/teacher/tasks" className="px-4 py-2 hover:bg-gray-100">
                    My Tasks
                  </Link>

                  <Link to="/teacher/assign-task" className="px-4 py-2 hover:bg-gray-100">
                    Assign Task
                  </Link>
                </div>
              </div>
            </>
          )}

          {!role && (
            <Link to="/assessment/public" className="text-white hover:underline font-normal">
              Assessment
            </Link>
          )}        
        </div>

        <div>
          <Link to="/honor-board" className="text-white hover:underline">
            Learnify Heroes
          </Link>
        </div>

        <div>
          <Link to="/membership" className="text-white hover:underline">
            Membership
          </Link>
        </div>

        <div>
          <Link to="/help-center" className="text-white hover:underline">
            Help Center
          </Link>
        </div>

        {role && (
          <div className="relative group">
            <button className="text-white hover:underline font-normal">
              Account Settings
            </button>
            <div className="absolute right-0 top-full hidden group-hover:block z-50 pt-2">
              <div className="w-56 flex flex-col bg-white text-black shadow-lg rounded text-lg">
                <a href={`${API}payments/choose/`} className="px-4 py-2 hover:bg-gray-100">
                  Make Payment
                </a>
                <Link to="/account/edit-profile" className="px-4 py-2 hover:bg-gray-100">
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {!role && (
          <div className="relative group">
            <button className="text-white hover:underline font-normal">
              Sign up
            </button>
            <div className="absolute right-0 top-full hidden group-hover:block z-50 pt-2">
              <div className="w-60 flex flex-col bg-white text-black shadow-lg rounded text-lg">
                <Link to="/signup" className="px-4 py-2 hover:bg-gray-100">
                  Create Account
                </Link>
                <a href={`${API}payments/choose/`} className="px-4 py-2 hover:bg-gray-100">
                  Make Payment
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section (full width) */}
      <section className="w-full">
        <div className="w-full h-[520px] overflow-hidden">
          <img
            src={heroBanner}
            alt="Learnify Pakistan Hero Banner"
            className="w-full h-full object-cover object-center block"
          />
        </div>
      </section>
      {/* Content Explorer */}
      <div className="mt-10 px-3 md:px-4 max-w-[1400px] mx-auto">
        {quizData.map((gradeItem, gradeIndex) => {
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
                      flex items-center gap-3
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
                <div className="mt-6 space-y-10">
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

                    
                    return (
                      <section key={`subject-${gradeIndex}-${subjectIndex}`} className="space-y-4">
                        {/* ✅ Subject styled like Grade (no big box) */}
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
                        {/* Modern two-panel layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
                          {/* LEFT: Chapters */}
                            <div
                              className={`rounded-2xl border-2 shadow-sm overflow-hidden bg-white
                                ${activePalette ? activePalette.panelBorder : "border-[#42b72a]"}
                              `}
                            >
                              {/* Header bar (matches Exercises header style) */}
                              <div
                                className={`px-5 py-4 border-b
                                  ${activePalette ? activePalette.panelBg : "bg-gray-50"}
                                  ${activePalette ? activePalette.panelBorder : "border-[#42b72a]"}
                                `}
                              >
                                <div className={`text-xl font-black ${activePalette ? activePalette.accent : "text-green-900"} drop-shadow-[0_0.6px_0_rgba(0,0,0,0.25)]`}>
                                  Chapters
                                </div>
                              </div>

                              {/* Body */}
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
                                        className={`w-full flex items-center gap-3 text-left p-3 rounded-xl border-2 transition shadow-sm
                                          ${palette.cardBg} ${palette.cardBorder}
                                          ${pinned ? "ring-2 ring-offset-2 ring-green-400" : "hover:shadow-md"}
                                        `}
                                        title="Hover to preview exercises • Click to keep exercises open"
                                      >
                                        <div
                                          className={`h-10 w-10 rounded-lg flex items-center justify-center font-extrabold border-2 bg-white/70
                                            ${palette.cardBorder} text-gray-900
                                          `}
                                        >
                                          {idx + 1}
                                        </div>

                                        <div className="min-w-0">
                                          <div className={`font-normal text-[18px] md:text-[20px] truncate ${palette.titleText} drop-shadow-[0_0.5px_0_rgba(0,0,0,0.30)]`}>
                                            {chapterItem.chapter}
                                          </div>
                                          <div className="mt-1 inline-block text-xs font-semibold text-gray-900 bg-white/80 px-2 py-0.5 rounded">
                                            {Array.isArray(chapterItem.quizzes)
                                              ? `${chapterItem.quizzes.length} exercises`
                                              : "0 exercises"}
                                          </div>
                                        </div>

                                        <div className="ml-auto font-bold text-gray-500">
                                          {pinned ? "📌" : "›"}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          {/* RIGHT: Exercises */}
                          <div
                              className={`rounded-2xl border-2 shadow-sm overflow-hidden bg-white
                                ${activePalette ? activePalette.panelBorder : "border-gray-200"}
                              `}
                            >
                            <div
                                className={`px-5 py-4 border-b
                                  ${activePalette ? activePalette.panelBg : "bg-gray-50"}
                                  ${activePalette ? activePalette.panelBorder : "border-gray-200"}
                                `}
                              >
                              <div className={`text-xl font-black ${activePalette ? activePalette.accent : "text-green-900"} drop-shadow-[0_0.6px_0_rgba(0,0,0,0.25)]`}>
                                {activeChapterObj ? `Exercises — ${activeChapterObj.chapter}` : "Exercises"}
                              </div>
                              
                            </div>

                            <div className="p-5">
                              {!activeChapterObj ? (
                                <div className="text-gray-500 text-center py-12">
                                  Select a chapter to view exercises.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {sortedQuizzes(activeChapterObj.quizzes).map((quiz) => {
                                    const history = historyMap[String(quiz.id)];

                                    return (
                                      <Link
                                        key={`quiz-${quiz.id}`}
                                        to={`/student/attempt-quiz/${quiz.id}`}
                                        className={`block rounded-xl border px-4 py-3 transition duration-150 hover:shadow-md hover:brightness-95
                                          ${
                                            activePalette
                                              ? `${activePalette.panelBorder} ${activePalette.panelBg}`
                                              : "border-gray-200 bg-white"
                                          }
                                        `}
                                      >
                                        {/* Title */}
                                        <div
                                          className={`font-medium ${
                                            activePalette ? activePalette.accent : "text-green-900"
                                          } drop-shadow-[0_0.5px_0_rgba(0,0,0,0.22)]`}
                                        >
                                          {quiz.title}
                                        </div>

                                        {/* ✅ Score + Grade */}
                                        {role === "student" && history && (
                                          <div className="mt-1 flex items-center justify-center gap-2 text-xs font-semibold">
                                            <span className="px-2 py-0.5 rounded-full bg-white/70 border border-gray-200 text-gray-700">
                                              Score: {history.marks_obtained}/{history.total_marks}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-white/70 border border-gray-200 text-gray-700">
                                              {history.percentage}% • {history.grade_letter}
                                            </span>
                                          </div>
                                        )}

                                        {/* Loading hint */}
                                        {role === "student" && !history && historyLoading && (
                                          <div className="mt-1 text-[11px] text-gray-500">Loading score…</div>
                                        )}
                                      </Link>
                                    );
                                  })}
                                </div>
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
    </div>
  );
};

export default LandingPage;