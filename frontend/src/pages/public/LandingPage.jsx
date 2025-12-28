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

  // NEW (presentation-only state)
  const [openGrades, setOpenGrades] = useState(new Set()); // collapsible grade bars
  const [pinnedChapterBySubject, setPinnedChapterBySubject] = useState({}); // subjectKey -> chapterKey
  const [hoverChapterBySubject, setHoverChapterBySubject] = useState({}); // subjectKey -> chapterKey

  // Force full-page light-green background everywhere
  useEffect(() => {
    const prevBG = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#f6fff6";
    return () => {
      document.body.style.backgroundColor = prevBG;
    };
  }, []);

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
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_full_name");
    localStorage.removeItem("account_status");
    setRole(null);
    setFullName("");
    window.location.href = "/";
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

    // 🎨 Kid-friendly chapter colors (Tailwind classes)
  // Split background + border so we can apply them cleanly (no conflicts)
  const chapterPalettes = [
    { cardBg: "bg-rose-50",    cardBorder: "border-rose-200",    accent: "text-rose-700",    panelBg: "bg-rose-50",    panelBorder: "border-rose-200" },
    { cardBg: "bg-amber-50",   cardBorder: "border-amber-200",   accent: "text-amber-700",   panelBg: "bg-amber-50",   panelBorder: "border-amber-200" },
    { cardBg: "bg-lime-50",    cardBorder: "border-lime-200",    accent: "text-lime-700",    panelBg: "bg-lime-50",    panelBorder: "border-lime-200" },
    { cardBg: "bg-emerald-50", cardBorder: "border-emerald-200", accent: "text-emerald-700", panelBg: "bg-emerald-50", panelBorder: "border-emerald-200" },
    { cardBg: "bg-sky-50",     cardBorder: "border-sky-200",     accent: "text-sky-700",     panelBg: "bg-sky-50",     panelBorder: "border-sky-200" },
    { cardBg: "bg-indigo-50",  cardBorder: "border-indigo-200",  accent: "text-indigo-700",  panelBg: "bg-indigo-50",  panelBorder: "border-indigo-200" },
    { cardBg: "bg-fuchsia-50", cardBorder: "border-fuchsia-200", accent: "text-fuchsia-700", panelBg: "bg-fuchsia-50", panelBorder: "border-fuchsia-200" },
    { cardBg: "bg-teal-50",    cardBorder: "border-teal-200",    accent: "text-teal-700",    panelBg: "bg-teal-50",    panelBorder: "border-teal-200" },
  ];

  const getChapterPalette = (i) => chapterPalettes[i % chapterPalettes.length];

  const brandTitle = "Learnify Pakistan";
  const brandMotto = "Learning with Responsibility";

  return (
    <div className="min-h-screen font-[Nunito] text-gray-800 bg-[#f6fff6]">
      {/* Header (same before/after login, with requested layout) */}
      <header className="flex justify-between items-center px-4 pt-4 pb-2">
        {/* Left: logo + brand + motto */}
        <div className="flex items-center gap-4 min-w-0">
          <img src={logo} alt="Learnify Pakistan Logo" className="h-20 md:h-24" />
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
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
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
      </header>

      {/* Navbar (unchanged) */}
      <nav className="flex justify-evenly items-center text-center text-lg font-normal bg-[#42b72a] text-white relative z-30">
        <div className="py-2">
          <Link to="/why-join" className="text-white hover:underline">
            Why Join Learnify?
          </Link>
        </div>

        <div className="relative group py-2">
          {role === "student" && (
            <>
              <button className="text-white hover:underline font-normal">Assessment</button>
              <div className="absolute left-0 mt-2 w-60 hidden group-hover:flex flex-col bg-white text-black shadow-lg rounded z-50">
                <Link to="/student/assessment" className="px-4 py-2 hover:bg-gray-100">
                  Subject-wise Performance
                </Link>
                <Link to="/student/quiz-history" className="px-4 py-2 hover:bg-gray-100">
                  Quiz History
                </Link>
              </div>
            </>
          )}
          {role === "teacher" && (
            <Link to="/teacher/assessment" className="text-white hover:underline font-normal">
              Assessment
            </Link>
          )}
          {!role && (
            <Link to="/assessment/public" className="text-white hover:underline font-normal">
              Assessment
            </Link>
          )}
        </div>

        <div className="py-2">
          <Link to="/honor-board" className="text-white hover:underline">
            Learnify Heroes
          </Link>
        </div>
        <div className="py-2">
          <Link to="/membership" className="text-white hover:underline">
            Membership
          </Link>
        </div>
        <div className="py-2">
          <Link to="/help-center" className="text-white hover:underline">
            Help Center
          </Link>
        </div>

        {role && (
          <div className="relative group py-2">
            <button className="text-white hover:underline font-normal">Account Settings</button>
            <div className="absolute right-0 mt-2 w-56 hidden group-hover:flex flex-col bg-white text-black shadow-lg rounded z-50">
              <a href={`${API}payments/choose/`} className="px-4 py-2 hover:bg-gray-100">
                Make Payment
              </a>
              <Link to="/account/edit-profile" className="px-4 py-2 hover:bg-gray-100">
                Edit Profile
              </Link>
            </div>
          </div>
        )}

        {!role && (
          <div className="relative group py-2">
            <button className="text-white hover:underline font-normal">Sign up</button>
            <div className="absolute right-0 mt-2 w-60 hidden group-hover:flex flex-col bg-white text-black shadow-lg rounded z-50">
              <Link to="/signup" className="px-4 py-2 hover:bg-gray-100">
                Create Account
              </Link>
              <a href={`${API}payments/choose/`} className="px-4 py-2 hover:bg-gray-100">
                Make Payment
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section (unchanged) */}
      <section className="w-full mt-10">
        <div
          className="w-full bg-[#f6fff6] flex justify-center items-center overflow-hidden"
          style={{ height: "450px" }}
        >
          <img
            src={heroBanner}
            alt="Learnify Pakistan Hero Banner"
            className="h-full object-contain"
            style={{ objectPosition: "center center" }}
          />
        </div>
      </section>

      {/* Content Explorer */}
      <div className="mt-10 px-4 md:px-6 max-w-[1200px] mx-auto">
        {quizData.map((gradeItem, gradeIndex) => {
          const gradeOpen = openGrades.has(gradeItem.grade);

          return (
            <div key={`grade-${gradeIndex}`} className="mb-12">
              {/* ✅ Grade itself is the toggle (no extra expand/collapse button) */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => toggleGrade(gradeItem.grade)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-green-200 bg-white/70 shadow-sm hover:shadow transition
                             text-2xl font-extrabold text-green-900"
                  title="Click to expand/collapse"
                >
                  {gradeItem.grade}
                  <span className="text-base font-bold">{gradeOpen ? "▾" : "▸"}</span>
                </button>
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
                          <div className="text-2xl font-extrabold text-green-900">
                            {subjectItem.subject}
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
                                            ${palette.cardBorder} ${palette.accent}
                                          `}
                                        >
                                          {idx + 1}
                                        </div>

                                        <div className="min-w-0">
                                          <div className={`font-extrabold text-base md:text-lg truncate ${palette.accent} drop-shadow-[0_0.5px_0_rgba(0,0,0,0.25)]`}>
                                            {chapterItem.chapter}
                                          </div>
                                          <div className="text-xs font-semibold text-gray-800">
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
                                  {sortedQuizzes(activeChapterObj.quizzes).map((quiz) => (
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
                                      <div className={`font-medium ${activePalette ? activePalette.accent : "text-green-900"} drop-shadow-[0_0.5px_0_rgba(0,0,0,0.22)]`}>
                                        {quiz.title}
                                      </div>
                                      
                                    </Link>
                                  ))}
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