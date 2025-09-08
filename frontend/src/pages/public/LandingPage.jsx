import React, { useState, useEffect, useMemo } from "react";
import logo from "../../assets/logo.png";
import "../../App.css";
import axiosInstance from '../../utils/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';

/** Optional: put short topic blurbs here. Key is `${subject}::${chapterTitle}` */
const CHAPTER_TOPICS = {
  // "Mathematics::Chapter 1 - Whole Numbers.": "Counting, place value, comparing",
  // "Mathematics::Chapter 2 - Number Operations.": "Add/subtract within 100",
};

const LandingPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const [userFullName, setFullName] = useState('');
  const [quizData, setQuizData] = useState([]);

  // optional: completed quiz ids for the logged-in student
  const [completedIds, setCompletedIds] = useState(new Set());

  // legacy drawer state (kept) + new per-card toggle key
  const [openDetail, setOpenDetail] = useState(null);
  const [openCardKey, setOpenCardKey] = useState(null); // `${gradeIndex}-${subjectIndex}-${chapterFlatIdx}`

  const navigate = useNavigate();

  /* Force full-page light-green background (no white gutters) */
  useEffect(() => {
    const prevBG = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#f6fff6';
    return () => { document.body.style.backgroundColor = prevBG; };
  }, []);

  /* Load role and name */
  useEffect(() => {
    const storedRole = localStorage.getItem('user_role');
    const storedName = localStorage.getItem('user_full_name');
    setRole(storedRole);
    setFullName(storedName);
  }, []);

  /* Expired user redirect */
  useEffect(() => {
    const status = localStorage.getItem('account_status');
    const roleLS = localStorage.getItem('user_role');
    if ((roleLS === 'student' || roleLS === 'teacher') && status === 'expired') {
      alert("Your subscription has expired. Redirecting to renewal page...");
      navigate('/account/renew-subscription');
    }
  }, [navigate]);

  /* Fetch quiz data for landing */
  useEffect(() => {
    import('axios').then(({ default: axios }) => {
      axios.get(`${import.meta.env.VITE_API_BASE_URL}landing/quizzes/`)
        .then(res => {
          console.log("✅ Public Quiz API Response:", res.data);
          setQuizData(res.data);
        })
        .catch(err => console.error("❌ Error fetching quizzes:", err));
    });
  }, []);

  /* Optionally fetch completed quiz ids for the logged-in student (safe if endpoint missing) */
  useEffect(() => {
    if (!role) return;
    // Try a likely endpoint. If your backend differs, update this path.
    axiosInstance.get('student/completed-quiz-ids/')
      .then(res => {
        const ids = Array.isArray(res.data) ? res.data : (res.data?.ids || []);
        setCompletedIds(new Set(ids.map(String)));
      })
      .catch(() => {
        // Silently ignore if endpoint not present; UI will just show 0 completed.
        setCompletedIds(new Set());
      });
  }, [role]);

  /* ====== existing helpers (kept) ====== */
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

  /* Chapter card tints — gentle variety */
  const chapterCardTints = [
    "bg-gray-100",
    "bg-slate-100",
    "bg-stone-100",
    "bg-zinc-100",
    "bg-rose-100",
    "bg-amber-100",
    "bg-sky-100",
    "bg-emerald-100",
  ];

  const handleLogin = async () => {
    try {
      const res = await axiosInstance.post('token/', { username, password });

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('account_status', res.data.account_status);
      localStorage.setItem('role', res.data.role);

      const me = await axiosInstance.get('user/me/');
      const roleMe = me.data.role;
      const fullName = me.data.full_name || me.data.username;
      const status = me.data.account_status;

      if (roleMe === 'admin' || roleMe === 'manager') {
        alert("Admins and Managers must login from the backend.");
        return;
      }

      localStorage.setItem('user_role', roleMe);
      localStorage.setItem('user_full_name', fullName);
      localStorage.setItem('account_status', status);
      setRole(roleMe);
      setFullName(fullName);

      if ((roleMe === 'student' || roleMe === 'teacher') && status === 'expired') {
        navigate('/account/renew-subscription');
      } else {
        navigate('/');
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_full_name');
    localStorage.removeItem('account_status');
    setRole(null);
    setFullName('');
    window.location.href = '/';
  };

  /* Helpers for chapter meta */
  const chapterKey = (subject, chapterTitle) => `${subject}::${chapterTitle}`;
  const getTopics = (subject, chapterTitle) =>
    CHAPTER_TOPICS[chapterKey(subject, chapterTitle)] || "";

  const countCompletedIn = (quizArr = []) =>
    quizArr.reduce((acc, q) => acc + (completedIds.has(String(q.id)) ? 1 : 0), 0);

  /* Legacy drawer helpers (kept for compatibility) */
  const openChapterDetail = (payload) => setOpenDetail(payload);
  const closeChapterDetail = () => setOpenDetail(null);

  const drawer = useMemo(() => {
    if (!openDetail) return null;
    const { subjectName, chapterTitle, quizzes } = openDetail;
    const sorted = [...(quizzes || [])].sort((a, b) => {
      const numA = parseInt((a.title || '').trim().match(/^\d+/)?.[0] ?? '999999', 10);
      const numB = parseInt((b.title || '').trim().match(/^\d+/)?.[0] ?? '999999', 10);
      if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) return numA - numB;
      return (a.title || '').localeCompare(b.title || '');
    });
    return { subjectName, chapterTitle, sorted };
  }, [openDetail]);

  /* New: sort chapters by leading number for left→right order */
  const sortByLeadingNumber = (arr, field = 'chapter') => {
    const getNum = (txt) => parseInt((txt || '').trim().match(/^\d+/)?.[0] ?? '999999', 10);
    return [...(arr || [])].sort((a, b) => {
      const A = getNum(a[field]); const B = getNum(b[field]);
      if (Number.isFinite(A) && Number.isFinite(B) && A !== B) return A - B;
      return (a[field] || '').localeCompare(b[field] || '');
    });
  };

  return (
    <div className="min-h-screen font-[Nunito] text-gray-800 bg-[#f6fff6]">
      {/* Header */}
      <header className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="flex items-center space-x-6">
          <img src={logo} alt="Learnify Pakistan Logo" className="h-24" />
          {userFullName && (
            <span className="text-lg font-semibold text-gray-700 italic">
              Welcome, {userFullName}
            </span>
          )}
        </div>

        <div className="flex gap-4 items-center">
          {role ? (
            <button
              onClick={handleLogout}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            >
              Logout
            </button>
          ) : (
            <>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="px-3 py-1 border rounded"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-3 py-1 border rounded"
              />
              <button
                onClick={handleLogin}
                className="bg-[#42b72a] text-white px-4 py-1 rounded hover:bg-green-700"
              >
                Sign in
              </button>
              <label className="ml-2 text-sm">
                <input type="checkbox" className="mr-1" /> Remember
              </label>
            </>
          )}
        </div>
      </header>

      {/* Navbar */}
      <nav className="flex justify-evenly items-center text-center text-lg font-normal bg-[#42b72a] text-white relative z-30">
        <div className="py-2">
          <Link to="/why-join" className="text-white hover:underline">
            Why Join Learnify?
          </Link>
        </div>

        <div className="relative group py-2">
          {role === 'student' && (
            <>
              <button className="text-white hover:underline font-normal">Assessment</button>
              <div className="absolute left-0 mt-2 w-60 hidden group-hover:flex flex-col bg-white text-black shadow-lg rounded z-50">
                <Link to="/student/assessment" className="px-4 py-2 hover:bg-gray-100">Subject-wise Performance</Link>
                <Link to="/student/quiz-history" className="px-4 py-2 hover:bg-gray-100">Quiz History</Link>
              </div>
            </>
          )}
          {role === 'teacher' && (
            <Link to="/teacher/assessment" className="text-white hover:underline font-normal">Assessment</Link>
          )}
          {!role && (
            <Link to="/assessment/public" className="text-white hover:underline font-normal">Assessment</Link>
          )}
        </div>

        <div className="py-2">
          <Link to="/honor-board" className="text-white hover:underline">Learnify Heroes</Link>
        </div>
        <div className="py-2">
          <Link to="/membership" className="text-white hover:underline">Membership</Link>
        </div>
        <div className="py-2">
          <Link to="/help-center" className="text-white hover:underline">Help Center</Link>
        </div>

        {role && (
          <div className="relative group py-2">
            <button className="text-white hover:underline font-normal">Account Settings</button>
            <div className="absolute right-0 mt-2 w-56 hidden group-hover:flex flex-col bg-white text-black shadow-lg rounded z-50">
              <Link to="/account/renew-subscription" className="px-4 py-2 hover:bg-gray-100">Renew Subscription</Link>
              <Link to="/account/edit-profile" className="px-4 py-2 hover:bg-gray-100">Edit Profile</Link>
            </div>
          </div>
        )}

        {!role && (
          <div>
            <Link to="/signup" className="text-white hover:underline">Sign up</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-[#ecfbec] border border-green-300 shadow-md rounded-xl mt-10 p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl text-center font-bold text-[#1E7F12] mb-4">
          Learnify Pakistan: A Smarter Way to Learn
        </h2>
        <p className="text-lg text-gray-700 text-center max-w-4xl mx-auto">
          Learnify Pakistan is a modern digital learning platform designed especially for primary school students, teachers, and parents. Fully aligned with the National Curriculum, it offers an inclusive and affordable way to master school subjects, track performance in real time, and foster meaningful learning - inside and outside the classroom. Learnify brings education to life through unlimited quizzes, smart feedback, and parent-teacher visibility like never before.
        </p>
      </section>

      {/* Dynamic Quiz View */}
      <div className="mt-10 px-6 max-w-[1200px] mx-auto">
        {quizData.map((gradeItem, gradeIndex) => (
          <div key={`grade-${gradeIndex}`} className="mb-12">
            {/* tighter gap above subjects */}
            <h2 className="text-2xl font-bold text-green-800 text-center mb-3">
              {gradeItem.grade}
            </h2>

            {gradeItem.subjects.map((subjectItem, subjectIndex) => {
              // 1) order chapters 1,2,3… left→right
              const sortedChapters = sortByLeadingNumber(subjectItem.chapters || [], 'chapter');
              // counter for color cycling
              let tintIdx = 0;

              return (
                <div key={`subject-${gradeIndex}-${subjectIndex}`} className="mb-10">
                  {/* Subject heading */}
                  <h3 className="text-xl text-green-700 font-extrabold text-center mb-3">
                    {subjectItem.subject}
                  </h3>

                  {/* Chapters as equal-height cards in normal grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {sortedChapters.map((chapterItem, chapterFlatIdx) => {
                      const tint = chapterCardTints[tintIdx % chapterCardTints.length];
                      tintIdx += 1;

                      const quizzes = [...(chapterItem.quizzes || [])];
                      const total = quizzes.length;              // ✅ correct count
                      const completed = countCompletedIn(quizzes);
                      const pct = total ? Math.round((completed / total) * 100) : 0;

                      const topics = getTopics(subjectItem.subject, chapterItem.chapter);
                      const cardKey = `${gradeIndex}-${subjectIndex}-${chapterFlatIdx}`;
                      const isOpen = openCardKey === cardKey;

                      return (
                        <article
                          key={`chapter-${cardKey}`}
                          className={`rounded-2xl shadow border border-gray-200 ${tint} p-5 min-h-[190px] flex flex-col`}
                        >
                          {/* Chapter title */}
                          <h4 className="text-green-800 font-bold mb-1">
                            {chapterItem.chapter}.
                          </h4>

                          {/* topics (optional/manual) */}
                          <p className="text-sm text-gray-700 mb-1">
                            {topics || <span className="opacity-60">Topics: —</span>}
                          </p>

                          {/* meta – separate lines */}
                          <p className="text-sm text-gray-700">Quizzes: <b>{total}</b></p>
                          <p className="text-sm text-gray-700 mb-2">Completed: <b>{completed}</b></p>

                          {/* progress bar */}
                          <div className="h-2 bg-white/60 rounded mb-3 overflow-hidden">
                            <div className="h-2 bg-green-500" style={{ width: `${pct}%` }} />
                          </div>

                          {/* toggle quizzes inside THIS card */}
                          <div className="mt-auto">
                            <button
                              onClick={() => {
                                const payload = {
                                  gradeIndex,
                                  subjectIndex,
                                  chapterIndex: chapterFlatIdx,
                                  subjectName: subjectItem.subject,
                                  chapterTitle: chapterItem.chapter,
                                  quizzes,
                                };
                                setOpenCardKey(isOpen ? null : cardKey);  // new UX
                                openChapterDetail(payload);               // keep legacy state in sync
                              }}
                              className="text-sm px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
                            >
                              {isOpen ? "Hide quizzes" : "View quizzes"}
                            </button>
                          </div>

                          {/* quizzes inline, NO bullets */}
                          {isOpen && (
                            <div className="mt-3 rounded-xl border border-green-200 bg-white/70 p-3">
                              {quizzes.length ? (
                                <div className="grid grid-cols-1 gap-1">
                                  {[...quizzes]
                                    .sort((a, b) => {
                                      const getNum = t => parseInt((t || '').trim().match(/^\d+/)?.[0] ?? '999999', 10);
                                      const A = getNum(a.title), B = getNum(b.title);
                                      if (Number.isFinite(A) && Number.isFinite(B) && A !== B) return A - B;
                                      return (a.title || '').localeCompare(b.title || '');
                                    })
                                    .map((q) => (
                                      <Link
                                        key={q.id}
                                        to={`/student/attempt-quiz/${q.id}`}
                                        className="inline-block text-green-900 hover:text-green-700 hover:underline"
                                      >
                                        {q.title}
                                      </Link>
                                    ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-600">No quizzes available.</div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>

                  {/* Legacy subject-level drawer removed from UI (kept code above). */}
                  {false && openDetail && openDetail.subjectIndex === subjectIndex && (
                    <div className="mt-6 rounded-2xl border border-green-200 bg-white shadow p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-green-700">
                            {drawer?.subjectName}
                          </div>
                          <h4 className="text-lg font-extrabold text-green-900">
                            {drawer?.chapterTitle}
                          </h4>
                        </div>
                        <button
                          onClick={closeChapterDetail}
                          className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;