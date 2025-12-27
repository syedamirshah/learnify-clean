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

  // ====== existing helpers (unchanged) ======
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

  // Soft neutral tints we’ll cycle through for chapter cards
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

  // ✅ UI helper (no logic change): consistent dropdown container classes
  const dropdownBase =
    "absolute top-full mt-2 w-60 hidden group-hover:flex flex-col bg-white text-gray-800 shadow-xl rounded-xl border border-gray-200 z-50 overflow-hidden";
  const dropdownItem =
    "px-4 py-2 text-sm hover:bg-gray-50 active:bg-gray-100";

  return (
    <div className="min-h-screen font-[Nunito] text-gray-800 bg-[#f6fff6]">
      {/* Top bar / brand strip (pure UI) */}
      <div className="w-full bg-white/70 backdrop-blur border-b border-green-100">
        <div className="max-w-[1200px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Learnify Pakistan Logo" className="h-12" />
            <div className="leading-tight">
              <div className="text-green-800 font-extrabold text-lg">
                Learnify Pakistan
              </div>
              <div className="text-xs text-gray-600">
                Interactive quizzes • Grades 1–5 • Pakistan-aligned learning
              </div>
            </div>
          </div>

          {/* Right side: Welcome + login/logout */}
          <div className="flex items-center gap-3">
            {userFullName && (
              <span className="hidden md:inline text-sm font-semibold text-gray-700">
                Welcome, <span className="text-green-800">{userFullName}</span>
              </span>
            )}

            {role ? (
              <button
                onClick={handleLogout}
                className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition"
              >
                Logout
              </button>
            ) : (
              <div className="hidden md:flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-44 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-44 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
                <button
                  onClick={handleLogin}
                  className="bg-[#42b72a] text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Sign in
                </button>
                <label className="ml-1 text-xs text-gray-600 flex items-center gap-1">
                  <input type="checkbox" /> Remember
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile login box (same logic, just responsive UI) */}
      {!role && (
        <div className="md:hidden px-4 mt-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="text-sm font-bold text-green-800 mb-2">
              Sign in to continue
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <button
                onClick={handleLogin}
                className="bg-[#42b72a] text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar (fixed height, dropdowns do NOT push layout) */}
      <nav className="bg-[#42b72a] text-white relative z-30">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="h-12 flex items-center justify-between">
            {/* Left links */}
            <div className="flex items-center gap-5 text-sm md:text-base">
              <Link to="/why-join" className="hover:underline whitespace-nowrap">
                Why Join Learnify?
              </Link>

              {/* Assessment menu */}
              <div className="relative group">
                {role === "student" ? (
                  <>
                    <button className="hover:underline whitespace-nowrap">
                      Assessment
                    </button>

                    {/* hover bridge */}
                    <div className="absolute top-full left-0 h-3 w-60" />

                    <div className={dropdownBase}>
                      <Link to="/student/assessment" className={dropdownItem}>
                        Subject-wise Performance
                      </Link>
                      <Link to="/student/quiz-history" className={dropdownItem}>
                        Quiz History
                      </Link>
                    </div>
                  </>
                ) : role === "teacher" ? (
                  <Link
                    to="/teacher/assessment"
                    className="hover:underline whitespace-nowrap"
                  >
                    Assessment
                  </Link>
                ) : (
                  <Link
                    to="/assessment/public"
                    className="hover:underline whitespace-nowrap"
                  >
                    Assessment
                  </Link>
                )}
              </div>

              <Link to="/honor-board" className="hover:underline whitespace-nowrap">
                Learnify Heroes
              </Link>

              <Link to="/membership" className="hover:underline whitespace-nowrap">
                Membership
              </Link>

              <Link to="/help-center" className="hover:underline whitespace-nowrap">
                Help Center
              </Link>
            </div>

            {/* Right side menus */}
            <div className="flex items-center gap-3">
              {role ? (
                <div className="relative group">
                  <button className="hover:underline whitespace-nowrap">
                    Account Settings
                  </button>

                  {/* hover bridge */}
                  <div className="absolute top-full right-0 h-3 w-56" />

                  <div className={dropdownBase.replace("w-60", "w-56").replace("left-0", "right-0")}>
                    <a href={`${API}payments/choose/`} className={dropdownItem}>
                      Make Payment
                    </a>
                    <Link to="/account/edit-profile" className={dropdownItem}>
                      Edit Profile
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <button className="hover:underline whitespace-nowrap">
                    Sign up
                  </button>

                  {/* hover bridge */}
                  <div className="absolute top-full right-0 h-3 w-60" />

                  <div className={dropdownBase.replace("left-0", "right-0")}>
                    <Link to="/signup" className={dropdownItem}>
                      Create Account
                    </Link>
                    <a href={`${API}payments/choose/`} className={dropdownItem}>
                      Make Payment
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero + CTA (professional section, no logic changes) */}
      <section className="max-w-[1200px] mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <h1 className="text-3xl md:text-4xl font-extrabold text-green-900 leading-tight">
              Learning that feels simple,
              <br />
              structured, and motivating.
            </h1>
            <p className="mt-3 text-gray-700">
              Learnify Pakistan helps Grades 1–5 students practice with quizzes,
              instant feedback, and progress tracking — made for schools and
              families in Pakistan.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="bg-green-700 text-white px-5 py-2 rounded-xl hover:bg-green-800 transition"
              >
                Create Free Account
              </Link>
              <a
                href={`${API}payments/choose/`}
                className="bg-white text-green-800 border border-green-300 px-5 py-2 rounded-xl hover:bg-green-50 transition"
              >
                Subscribe / Make Payment
              </a>
              <Link
                to="/why-join"
                className="text-green-800 px-5 py-2 rounded-xl hover:bg-green-50 transition border border-transparent"
              >
                See how it works →
              </Link>
            </div>

            {/* trust strip */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
                <div className="font-bold text-green-900">Instant Feedback</div>
                <div className="text-gray-700">Students learn by doing.</div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
                <div className="font-bold text-green-900">Progress Tracking</div>
                <div className="text-gray-700">Teachers & parents can monitor.</div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
                <div className="font-bold text-green-900">Aligned Content</div>
                <div className="text-gray-700">Grade → Subject → Chapter.</div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-2xl p-3">
                <div className="font-bold text-green-900">Motivation</div>
                <div className="text-gray-700">Honors & recognition.</div>
              </div>
            </div>
          </div>

          {/* Your existing hero banner stays */}
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="w-full bg-[#f6fff6] flex justify-center items-center overflow-hidden h-[360px] md:h-[420px]">
              <img
                src={heroBanner}
                alt="Learnify Pakistan Hero Banner"
                className="h-full object-contain"
                style={{ objectPosition: "center center" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section heading before quizzes (pure UI) */}
      <div className="max-w-[1200px] mx-auto px-4 mt-12">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-green-900">
              Explore Quizzes
            </h2>
            <p className="text-gray-700 mt-1">
              Browse by grade → subject → chapter. Click any quiz title to attempt.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Tip: Start with one quiz. Build consistency daily.
          </div>
        </div>
      </div>

      {/* Dynamic Quiz View (UNCHANGED LOGIC; only spacing improved) */}
      <div className="mt-6 px-4 max-w-[1200px] mx-auto pb-16">
        {quizData.map((gradeItem, gradeIndex) => (
          <div key={`grade-${gradeIndex}`} className="mb-12">
            <h2 className="text-2xl font-bold text-green-800 text-center mb-3">
              {gradeItem.grade}
            </h2>

            {gradeItem.subjects.map((subjectItem, subjectIndex) => (
              <div
                key={`subject-${gradeIndex}-${subjectIndex}`}
                className="mb-10"
              >
                <h3 className="text-xl text-green-700 font-extrabold text-center mb-4">
                  {subjectItem.subject}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                  {(() => {
                    let colorCounter = 0;
                    return splitChaptersBalanced(subjectItem.chapters, 3).map(
                      (column, colIdx) => (
                        <div
                          key={`col-${subjectIndex}-${colIdx}`}
                          className="flex flex-col gap-6 h-full"
                        >
                          {column.map((chapterItem, chapterIndex) => {
                            const tint =
                              chapterCardTints[
                                colorCounter % chapterCardTints.length
                              ];
                            colorCounter += 1;

                            return (
                              <article
                                key={`chapter-${colIdx}-${chapterIndex}`}
                                className={`rounded-2xl shadow-sm border border-gray-200 ${tint} p-5`}
                              >
                                <div className="mb-2">
                                  <span className="text-green-800 font-bold">
                                    {chapterItem.chapter}.
                                  </span>
                                </div>

                                <ul className="list-none pl-0 ml-0 space-y-1 text-left">
                                  {[...chapterItem.quizzes]
                                    .sort((a, b) => {
                                      const numA = parseInt(
                                        (a.title || "")
                                          .trim()
                                          .match(/^\d+/)?.[0] ?? "999999",
                                        10
                                      );
                                      const numB = parseInt(
                                        (b.title || "")
                                          .trim()
                                          .match(/^\d+/)?.[0] ?? "999999",
                                        10
                                      );
                                      if (
                                        Number.isFinite(numA) &&
                                        Number.isFinite(numB) &&
                                        numA !== numB
                                      )
                                        return numA - numB;
                                      return (a.title || "").localeCompare(
                                        b.title || ""
                                      );
                                    })
                                    .map((quiz) => (
                                      <li key={`quiz-${quiz.id}`}>
                                        <Link
                                          to={`/student/attempt-quiz/${quiz.id}`}
                                          className="inline-block text-green-900 hover:text-green-700 hover:underline"
                                        >
                                          {quiz.title}
                                        </Link>
                                      </li>
                                    ))}
                                </ul>
                              </article>
                            );
                          })}
                        </div>
                      )
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer (pure UI) */}
      <footer className="border-t border-green-100 bg-white/70 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-4 py-6 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center text-sm text-gray-700">
          <div>
            <div className="font-bold text-green-900">Learnify Pakistan</div>
            <div>Grades 1–5 • Quizzes • Progress • Honors</div>
          </div>
          <div className="flex gap-4">
            <Link to="/help-center" className="hover:underline">
              Help Center
            </Link>
            <Link to="/membership" className="hover:underline">
              Membership
            </Link>
            <Link to="/why-join" className="hover:underline">
              Why Join
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;