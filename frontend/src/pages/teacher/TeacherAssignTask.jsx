import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";

export default function TeacherAssignTask() {
  const navigate = useNavigate();

  // form fields
  const [message, setMessage] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [mode, setMode] = useState("grade"); // "grade" | "students"
  const [gradeId, setGradeId] = useState("");

  const [studentsText, setStudentsText] = useState(""); // comma separated usernames
  const [selectedQuizIds, setSelectedQuizIds] = useState([]);

  // data
  const [grades, setGrades] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  // ✅ Filters
  const [subjectFilter, setSubjectFilter] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");

  // ui states
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // ✅ load grades list from landing/quizzes (no new backend endpoint needed)
  // ✅ CORRECT: load grades with real IDs
  // ✅ CORRECT: load grades with real IDs
  useEffect(() => {
    const loadGrades = async () => {
      try {
        setLoadingGrades(true);
        setErr("");

        const res = await axiosInstance.get("grades/"); // ✅ REAL IDs
        setGrades(
          (res.data || []).map((g) => ({
            id: g.id,
            label: g.name,
          }))
        );
      } catch (e) {
        console.error(e);
        setErr("Failed to load grades.");
      } finally {
        setLoadingGrades(false);
      }
    };

    loadGrades();
  }, []);

  // ✅ fetch quizzes when gradeId changes
  useEffect(() => {
    const loadQuizzes = async () => {
      if (!gradeId) {
        setQuizzes([]);
        setSelectedQuizIds([]);
        setSubjectFilter("");
        setChapterFilter("");
        return;
      }

      try {
        setLoadingQuizzes(true);
        setErr("");
        setOk("");

        const res = await axiosInstance.get(`teacher/quizzes/?grade=${gradeId}`);
        setQuizzes(Array.isArray(res.data) ? res.data : []);
        setSelectedQuizIds([]);
        setSubjectFilter("");
        setChapterFilter("");
      } catch (e) {
        console.error(e);
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.detail ||
          "Failed to load quizzes for this grade.";
        setErr(msg);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    loadQuizzes();
  }, [gradeId]);

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
    setUserFullName(localStorage.getItem("user_full_name") || "");
  }, []);

  const studentsList = useMemo(() => {
    // convert comma separated -> ["u1","u2"]
    return (studentsText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [studentsText]);

  const toggleQuiz = (id) => {
    setSelectedQuizIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return Array.from(set);
    });
  };

  const selectAll = () => {
    const visibleIds = (quizzes || [])
      .filter((q) => {
        if (subjectFilter && q.subject !== subjectFilter) return false;
        if (chapterFilter && q.chapter !== chapterFilter) return false;
        return true;
      })
      .map((q) => q.id);

    setSelectedQuizIds(visibleIds);
  };
  const clearAll = () => setSelectedQuizIds([]);

  const validate = () => {
    if (!message.trim()) return "Message is required.";
    if (!dueDate) return "Due date is required.";
    if (!Array.isArray(selectedQuizIds) || selectedQuizIds.length === 0)
      return "Please select at least 1 quiz.";
    if (!gradeId) return "Please choose a grade to load quizzes.";
    if (mode === "students" && studentsList.length === 0)
      return "Please enter at least 1 student username.";
    return "";
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setErr(v);
      setOk("");
      return;
    }

    try {
      setSubmitting(true);
      setErr("");
      setOk("");

      const payload = {
        message: message.trim(),
        due_date: dueDate,
        quizzes: selectedQuizIds,
      };

      if (mode === "grade") {
        payload.target_grade = Number(gradeId);
      } else {
        payload.target_students = studentsList;
      }

      const res = await axiosInstance.post("teacher/tasks/create/", payload);

      if (res.data?.success) {
        setOk(`✅ Task created (Task ID: ${res.data.task_id})`);
        // quick reset
        setMessage("");
        setDueDate("");
        setSelectedQuizIds([]);
        setStudentsText("");

        // optional: go to tasks list after 1 sec
        setTimeout(() => navigate("/teacher/tasks"), 800);
      } else {
        setErr("Task created response was unexpected.");
      }
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        "Failed to create task.";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Helpers for clean sorting/grouping
  const getQuizNumber = (title = "") => {
    const m = String(title).trim().match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : 999999;
  };

  const getChapterNumber = (chapter = "") => {
    const m = String(chapter).match(/Chapter\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : 999999;
  };

  // ✅ Group quizzes: Subject → Chapter → [quizzes]
  const groupedQuizzes = React.useMemo(() => {
    const bySubject = {};

    const filteredBase = (quizzes || []).filter((q) => {
      if (subjectFilter && q.subject !== subjectFilter) return false;
      if (chapterFilter && q.chapter !== chapterFilter) return false;
      return true;
    });

    filteredBase.forEach((q) => {
      const subject = q.subject || "Other";
      const chapter = q.chapter || "Other";

      if (!bySubject[subject]) bySubject[subject] = {};
      if (!bySubject[subject][chapter]) bySubject[subject][chapter] = [];

      bySubject[subject][chapter].push(q);
    });

    // sort subjects A-Z, chapters by number, quizzes by quiz number then title
    const subjectNames = Object.keys(bySubject).sort((a, b) => a.localeCompare(b));

    return subjectNames.map((subject) => {
      const chaptersObj = bySubject[subject];
      const chapterNames = Object.keys(chaptersObj).sort((a, b) => {
        const na = getChapterNumber(a);
        const nb = getChapterNumber(b);
        if (na !== nb) return na - nb;
        return a.localeCompare(b);
      });

      const chapters = chapterNames.map((chapter) => {
        const list = chaptersObj[chapter].slice().sort((a, b) => {
          const na = getQuizNumber(a.title);
          const nb = getQuizNumber(b.title);
          if (na !== nb) return na - nb;
          return String(a.title || "").localeCompare(String(b.title || ""));
        });

        return { chapter, quizzes: list };
      });

      return { subject, chapters };
    });
  }, [quizzes, subjectFilter, chapterFilter]);

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
  ];

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
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] text-gray-800">
        <section className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-extrabold text-green-900 sm:text-3xl">Assign Task</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Send quizzes to a grade or specific students</p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Link
              to="/"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto"
            >
              Back to Home
            </Link>
            <Link
              to="/teacher/tasks"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 sm:w-auto"
            >
              View My Tasks
            </Link>
          </div>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{err}</div>
          )}
          {ok && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{ok}</div>
          )}

          <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-green-900">Task Details</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Task Message</label>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., Complete these quizzes before Friday."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h2 className="text-base font-semibold text-green-900">Target</h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("grade")}
                  className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    mode === "grade"
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Whole Grade
                </button>

                <button
                  type="button"
                  onClick={() => setMode("students")}
                  className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    mode === "students"
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Specific Students
                </button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Select Grade (to load quizzes)</label>

                <select
                  value={gradeId}
                  onChange={(e) => setGradeId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Select --</option>

                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>

                {loadingGrades && (
                  <div className="mt-2 text-sm text-gray-500">Loading grades...</div>
                )}

                {!loadingGrades && grades.length === 0 && (
                  <div className="mt-2 text-sm text-gray-500">No grades found.</div>
                )}

                {mode === "students" && (
                  <div className="mt-2 text-xs text-gray-500">
                    Select a grade to load quizzes, then assign them to specific students.
                  </div>
                )}
              </div>

              {mode === "students" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Student Usernames (comma separated)
                  </label>
                  <input
                    value={studentsText}
                    onChange={(e) => setStudentsText(e.target.value)}
                    placeholder="e.g., ali123, sara55, hamza7"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Only students in your <b>school + city</b> will be accepted by the backend.
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-xl border border-gray-200 p-4">
              <h2 className="text-base font-semibold text-green-900">Quizzes</h2>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-gray-700">Select Quizzes</div>
                  <div className="text-xs text-gray-500">
                    {mode === "grade"
                      ? "Choose a grade to load quizzes."
                      : "Choose any grade to load quizzes, then assign to specific students."}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={selectAll}
                    disabled={quizzes.length === 0}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={selectedQuizIds.length === 0}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* ✅ Filters: Subject + Chapter */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Subject Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Filter by Subject</label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => {
                      setSubjectFilter(e.target.value);
                      setChapterFilter(""); // reset chapter when subject changes
                    }}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={quizzes.length === 0}
                  >
                    <option value="">All Subjects</option>
                    {[...new Set((quizzes || []).map((q) => q.subject).filter(Boolean))]
                      .sort((a, b) => a.localeCompare(b))
                      .map((subj) => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Chapter Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Filter by Chapter</label>
                  <select
                    value={chapterFilter}
                    onChange={(e) => setChapterFilter(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={quizzes.length === 0}
                  >
                    <option value="">All Chapters</option>
                    {[...new Set(
                      (quizzes || [])
                        .filter((q) => !subjectFilter || q.subject === subjectFilter)
                        .map((q) => q.chapter)
                        .filter(Boolean)
                    )]
                      .sort((a, b) => {
                        const na = getChapterNumber(a);
                        const nb = getChapterNumber(b);
                        if (na !== nb) return na - nb;
                        return a.localeCompare(b);
                      })
                      .map((ch) => (
                        <option key={ch} value={ch}>
                          {ch}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {loadingQuizzes && (
                <div className="mt-3 text-sm text-gray-600">Loading quizzes…</div>
              )}

              {!loadingQuizzes && quizzes.length === 0 && (
                <div className="mt-3 text-sm text-gray-600">No quizzes loaded yet.</div>
              )}

              {!loadingQuizzes && quizzes.length > 0 && (
                <div className="mt-4 space-y-6">
                  {groupedQuizzes.map((sub) => (
                    <div key={sub.subject} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      {/* Subject */}
                      <div className="border-b bg-gray-50 px-4 py-3">
                        <div className="text-lg font-bold text-gray-900">{sub.subject}</div>
                      </div>

                      {/* Chapters */}
                      <div className="space-y-5 p-4">
                        {sub.chapters.map((ch) => (
                          <div key={ch.chapter}>
                            <div className="mb-2 text-sm font-semibold text-gray-700">{ch.chapter}</div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              {ch.quizzes.map((q) => {
                                const checked = selectedQuizIds.includes(q.id);

                                return (
                                  <label
                                    key={q.id}
                                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50"
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-1 h-4 w-4"
                                      checked={checked}
                                      onChange={() => toggleQuiz(q.id)}
                                    />

                                    <div className="min-w-0">
                                      <div className="font-semibold text-gray-900">{q.title}</div>
                                      <div className="mt-1 text-xs text-gray-600">
                                        Grade: {q.grade} • Chapter: {q.chapter}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-white transition hover:bg-green-700 disabled:opacity-60 sm:w-auto"
              >
                {submitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
