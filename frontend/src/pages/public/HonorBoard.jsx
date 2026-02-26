import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import axiosInstance from "../../utils/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";

const HonorBoard = () => {
  const [shiningStars, setShiningStars] = useState([]);
  const [nationalHeroes, setNationalHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("rank");
  const navigate = useNavigate();
  const publicAxios = axios.create({ baseURL: axiosInstance.defaults.baseURL });

  const fetchWithFallback = async (url1, url2) => {
    try {
      const res = await publicAxios.get(url1);
      return res.data;
    } catch (firstError) {
      try {
        const fallbackRes = await publicAxios.get(url2);
        return fallbackRes.data;
      } catch (secondError) {
        console.error("Honor board fetch failed", {
          primaryUrl: url1,
          fallbackUrl: url2,
          primaryStatus: firstError?.response?.status || null,
          fallbackStatus: secondError?.response?.status || null,
          primaryMessage: firstError?.response?.data || firstError?.message || null,
          fallbackMessage: secondError?.response?.data || secondError?.message || null,
        });
        throw secondError;
      }
    }
  };

  const apiUrl = (pathNoApiPrefix, pathWithApiPrefix) => {
    const base = axiosInstance?.defaults?.baseURL || "";
    const baseHasApi = typeof base === "string" && base.includes("/api");
    return baseHasApi ? pathNoApiPrefix : pathWithApiPrefix;
  };

  useEffect(() => {
    const fetchHonorData = async () => {
      try {
        const [starsData, heroesData] = await Promise.all([
          fetchWithFallback(
            apiUrl("honors/shining-stars/", "/api/honors/shining-stars/"),
            "/honors/shining-stars/"
          ),
          fetchWithFallback(
            apiUrl("honors/national-heroes/", "/api/honors/national-heroes/"),
            "/honors/national-heroes/"
          ),
        ]);
        setShiningStars(starsData);
        setNationalHeroes(heroesData);
        setLoading(false);
      } catch (fetchError) {
        console.error("Failed to load honor board:", fetchError);
        setError("Failed to load honor board.");
        setLoading(false);
      }
    };

    fetchHonorData();
  }, []);

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
    setUserFullName(localStorage.getItem("user_full_name") || "");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_full_name");
    localStorage.removeItem("account_status");
    localStorage.removeItem("role");
    localStorage.removeItem("user_grade");
    navigate("/", { replace: true });
  };

  const navItems = [
    { key: "home", label: "Home", href: "/" },
    { key: "why-join", label: "Why Join Learnify?", href: "/why-join" },
    ...(role === "student"
      ? [
          {
            key: "assessment",
            label: "Assessment",
            href: "/student/assessment",
            children: [
              { key: "subject-wise", label: "Subject-wise Performance", href: "/student/assessment" },
              { key: "quiz-history", label: "Quiz History", href: "/student/quiz-history" },
              { key: "tasks", label: "Tasks", href: "/student/tasks" },
            ],
          },
        ]
      : []),
    ...(role === "teacher"
      ? [
          {
            key: "assessment",
            label: "Assessment",
            href: "/teacher/assessment",
            children: [
              { key: "student-results", label: "Student Results", href: "/teacher/assessment" },
              { key: "teacher-tasks", label: "My Tasks", href: "/teacher/tasks" },
              { key: "assign-task", label: "Assign Task", href: "/teacher/assign-task" },
            ],
          },
        ]
      : []),
    { key: "honor-board", label: "Honor Board", href: "/honor-board" },
    { key: "membership", label: "Membership", href: "/membership" },
    { key: "help-center", label: "Help Center", href: "/help-center" },
    ...(!role
      ? [
          {
            key: "sign-up",
            label: "Sign up",
            href: "/signup",
            children: [{ key: "create-account", label: "Create Account", href: "/signup" }],
          },
        ]
      : []),
  ];

  const palettes = useMemo(
    () => [
      { cardBg: "bg-emerald-50", border: "border-emerald-200", headBg: "bg-emerald-100", accent: "text-emerald-800" },
      { cardBg: "bg-lime-50", border: "border-lime-200", headBg: "bg-lime-100", accent: "text-lime-800" },
      { cardBg: "bg-sky-50", border: "border-sky-200", headBg: "bg-sky-100", accent: "text-sky-800" },
      { cardBg: "bg-amber-50", border: "border-amber-200", headBg: "bg-amber-100", accent: "text-amber-800" },
      { cardBg: "bg-rose-50", border: "border-rose-200", headBg: "bg-rose-100", accent: "text-rose-800" },
    ],
    []
  );

  const getPalette = (i) => palettes[i % palettes.length];

  const gradeOptions = useMemo(() => {
    const gradeSet = new Set();
    [...(shiningStars || []), ...(nationalHeroes || [])].forEach((group) => {
      if (group?.grade !== null && group?.grade !== undefined && String(group.grade).trim() !== "") {
        gradeSet.add(String(group.grade));
      }
    });

    const isNumeric = (value) => /^-?\d+(\.\d+)?$/.test(value);
    return Array.from(gradeSet).sort((a, b) => {
      if (isNumeric(a) && isNumeric(b)) return Number(a) - Number(b);
      return a.localeCompare(b);
    });
  }, [shiningStars, nationalHeroes]);

  const deriveViewData = (rawGroups) => {
    const query = searchQuery.trim().toLowerCase();
    const normalizeNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
    };

    return (rawGroups || [])
      .filter((group) => {
        if (selectedGrade === "ALL") return true;
        return String(group?.grade) === String(selectedGrade);
      })
      .map((group) => {
        const filteredStudents = (group?.top_students || []).filter((student) => {
          if (!query) return true;
          const fullName = String(student?.full_name || "").toLowerCase();
          const school = String(student?.school || "").toLowerCase();
          const city = String(student?.city || "").toLowerCase();
          const province = String(student?.province || "").toLowerCase();
          return (
            fullName.includes(query) ||
            school.includes(query) ||
            city.includes(query) ||
            province.includes(query)
          );
        });

        const sortedStudents =
          sortKey === "rank"
            ? filteredStudents
            : [...filteredStudents].sort((a, b) => {
                if (sortKey === "total_marks") {
                  return normalizeNum(b?.total_marks) - normalizeNum(a?.total_marks);
                }
                if (sortKey === "average_score") {
                  return normalizeNum(b?.average_score) - normalizeNum(a?.average_score);
                }
                return 0;
              });

        return {
          ...group,
          top_students: sortedStudents,
        };
      })
      .filter((group) => (group?.top_students || []).length > 0);
  };

  const shiningStarsView = useMemo(
    () => deriveViewData(shiningStars),
    [shiningStars, selectedGrade, searchQuery, sortKey]
  );
  const nationalHeroesView = useMemo(
    () => deriveViewData(nationalHeroes),
    [nationalHeroes, selectedGrade, searchQuery, sortKey]
  );

  const rankBadge = (idx) => {
    if (idx === 0) {
      return "ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800";
    }
    if (idx === 1) {
      return "ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold text-slate-700";
    }
    if (idx === 2) {
      return "ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-extrabold text-orange-700";
    }
    return "";
  };

  const renderTable = (title, data, icon) => (
    <div className="mb-14">
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl md:text-2xl font-extrabold text-green-900 text-center">
          {title}
        </h2>
      </div>

      {data.length === 0 ? (
        <div aria-live="polite" className="bg-white border border-green-200 rounded-2xl shadow-sm p-8 text-center">
          <div className="text-green-800 font-semibold">No data available.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((group, index) => {
            const p = getPalette(index);

            return (
              <div
                key={index}
                className={`rounded-2xl border-2 shadow-sm overflow-hidden bg-white ${p.border}`}
              >
                {/* Grade Header */}
                <div className={`px-5 py-4 border-b ${p.headBg} ${p.border}`}>
                  <div className={`text-lg md:text-xl font-black ${p.accent}`}>
                    Grade {group.grade}
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 p-4 md:hidden">
                  {group.top_students.map((student, idx) => (
                    <article
                      key={`m-${idx}`}
                      className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-900">
                          Rank #{idx + 1}
                          {idx < 3 ? (
                            <span className={rankBadge(idx)}>
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                            </span>
                          ) : null}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-green-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-900">
                          {student.average_score != null ? `${student.average_score}%` : "-"}
                        </span>
                      </div>
                      <h3 className="break-words text-base font-bold text-gray-900">
                        {student.full_name || "N/A"}
                      </h3>
                      <div className="mt-3 grid grid-cols-1 gap-1.5 text-sm">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="text-gray-600">School</span>
                          <span className="min-w-0 break-words text-right font-semibold text-gray-800">{student.school || "-"}</span>
                        </div>
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="text-gray-600">City</span>
                          <span className="min-w-0 break-words text-right font-semibold text-gray-800">{student.city || "-"}</span>
                        </div>
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="text-gray-600">Province</span>
                          <span className="min-w-0 break-words text-right font-semibold text-gray-800">{student.province || "-"}</span>
                        </div>
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="text-gray-600">Quizzes</span>
                          <span className="font-semibold text-gray-800">{student.quizzes_attempted ?? "-"}</span>
                        </div>
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="text-gray-600">Total Marks</span>
                          <span className="font-extrabold text-gray-900">{student.total_marks ?? "-"}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-sm">
                    <caption className="sr-only">
                      {title} table showing rank, name, school, city, province, quizzes, average score, and total marks.
                    </caption>
                    <thead>
                      <tr className="bg-white text-green-900">
                        <th scope="col" className="px-4 py-3 border-b text-center font-extrabold">Rank</th>
                        <th scope="col" className="px-4 py-3 border-b text-center font-extrabold">Name</th>
                        <th scope="col" className="px-4 py-3 border-b text-center font-extrabold">School</th>
                        <th scope="col" className="px-4 py-3 border-b text-center font-extrabold">City</th>
                        <th scope="col" className="px-4 py-3 border-b text-center font-extrabold">Province</th>
                        <th scope="col" className="px-4 py-3 border-b text-center font-extrabold">Quizzes</th>
                        <th scope="col" className="px-4 py-3 border-b text-center font-extrabold">Avg. Score</th>
                        <th scope="col" className="px-4 py-3 border-b text-center font-extrabold">Total Marks</th>
                      </tr>
                    </thead>

                    <tbody>
                      {group.top_students.map((student, idx) => (
                        <tr
                          key={idx}
                          className="border-b transition hover:bg-green-50/60"
                        >
                          <td className="px-4 py-3 text-center font-bold">
                            {idx + 1}
                            {idx < 3 ? (
                              <span className={rankBadge(idx)}>
                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 font-semibold break-words">
                            {student.full_name || "N/A"}
                          </td>
                          <td className="px-4 py-3 break-words">{student.school}</td>
                          <td className="px-4 py-3 break-words">{student.city}</td>
                          <td className="px-4 py-3 break-words">{student.province}</td>
                          <td className="px-4 py-3 text-center font-semibold">
                            {student.quizzes_attempted ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">
                            {student.average_score != null ? `${student.average_score}%` : "-"}
                          </td>
                          <td className="px-4 py-3 text-center font-extrabold">
                            {student.total_marks ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className={`px-5 py-3 ${p.cardBg} border-t ${p.border}`}>
                  <div className="text-xs text-gray-700 font-semibold">
                    Rankings are based on total marks and quiz attempts.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Learning with Responsibility"
      isAuthenticated={Boolean(role)}
      userFullName={userFullName}
      navItems={navItems}
      isMobileDrawerOpen={mobileDrawerOpen}
      onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
      onLogoutClick={handleLogout}
      mobileAuthContent={
        role ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-6 md:py-8">
          <div className="bg-white/70 border border-green-200 rounded-2xl shadow-sm px-5 sm:px-6 py-6 sm:py-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-green-900 flex justify-center gap-2">
              🏆 Honor Board
            </h1>
            <p className="mt-2 text-sm sm:text-base text-green-800 font-semibold">
              Celebrating our Shining Stars and National Heroes
            </p>
          </div>
          {!loading && !error ? (
            <div className="mt-5 rounded-2xl border border-green-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGrade("ALL")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${
                    selectedGrade === "ALL"
                      ? "bg-green-700 text-white"
                      : "bg-green-50 text-green-900 border border-green-200 hover:bg-green-100"
                  }`}
                >
                  All
                </button>
                {gradeOptions.map((grade) => (
                  <button
                    key={`chip-${grade}`}
                    type="button"
                    onClick={() => setSelectedGrade(String(grade))}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${
                      selectedGrade === String(grade)
                        ? "bg-green-700 text-white"
                        : "bg-green-50 text-green-900 border border-green-200 hover:bg-green-100"
                    }`}
                  >
                    Grade {grade}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-3 md:flex-row">
                <div className="min-w-0 flex-1">
                  <label htmlFor="honor-search" className="sr-only">
                    Search by student name, school, city, or province
                  </label>
                  <input
                    id="honor-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, school, city, or province"
                    className="w-full rounded-xl border border-green-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                  />
                </div>
                <div className="w-full md:w-56">
                  <label htmlFor="honor-sort" className="sr-only">
                    Sort students
                  </label>
                  <select
                    id="honor-sort"
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                    className="w-full rounded-xl border border-green-200 px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                  >
                    <option value="rank">Sort: Rank</option>
                    <option value="total_marks">Sort: Total Marks</option>
                    <option value="average_score">Sort: Avg Score</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-8">
            {loading ? (
              <div aria-live="polite" className="bg-white border border-green-200 rounded-2xl shadow-sm p-10 text-center">
                <div className="text-green-900 font-bold">Loading…</div>
              </div>
            ) : error ? (
              <div aria-live="polite" className="bg-white border border-red-200 rounded-2xl shadow-sm p-10 text-center">
                <div className="font-semibold text-red-700">{error}</div>
              </div>
            ) : shiningStars.length === 0 && nationalHeroes.length === 0 ? (
              <div aria-live="polite" className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
                <div className="font-semibold text-green-900">No honor board data available right now.</div>
                <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row">
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white/70 px-4 py-2 text-sm font-semibold text-green-900 shadow-sm transition hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                  >
                    Go to Home
                  </Link>
                  <Link
                    to="/membership"
                    className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white/70 px-4 py-2 text-sm font-semibold text-green-900 shadow-sm transition hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                  >
                    View Membership
                  </Link>
                </div>
              </div>
            ) : shiningStarsView.length === 0 && nationalHeroesView.length === 0 ? (
              <div aria-live="polite" className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
                <div className="font-semibold text-green-900">No results match your filters/search.</div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGrade("ALL");
                    setSearchQuery("");
                    setSortKey("rank");
                  }}
                  className="mt-3 inline-flex items-center justify-center rounded-xl border border-green-200 bg-white/70 px-4 py-2 text-sm font-semibold text-green-900 shadow-sm transition hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                >
                  Clear filters
                </button>
                <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row">
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white/70 px-4 py-2 text-sm font-semibold text-green-900 shadow-sm transition hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                  >
                    Go to Home
                  </Link>
                  <Link
                    to="/membership"
                    className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white/70 px-4 py-2 text-sm font-semibold text-green-900 shadow-sm transition hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                  >
                    View Membership
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {shiningStarsView.length > 0
                  ? renderTable("Shining Stars (Top Performers of the Month)", shiningStarsView, "🌟")
                  : null}
                {nationalHeroesView.length > 0
                  ? renderTable("National Heroes (Top Performers of the Quarter)", nationalHeroesView, "🏅")
                  : null}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default HonorBoard;
