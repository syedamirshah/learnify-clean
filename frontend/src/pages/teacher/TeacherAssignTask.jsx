import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import { buildPublicNavItems } from "../../utils/publicNav";

const BRAND_GREEN = "#42b72a";

export default function TeacherAssignTask() {
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [mode, setMode] = useState("grade");
  const [gradeId, setGradeId] = useState("");

  const [studentsText, setStudentsText] = useState("");
  const [selectedQuizIds, setSelectedQuizIds] = useState([]);

  const [grades, setGrades] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [subjectFilter, setSubjectFilter] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");

  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState({
    message: false,
    dueDate: false,
    gradeId: false,
    students: false,
  });

  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showFieldError = (field) => submitAttempted || touched[field];

  useEffect(() => {
    const loadGrades = async () => {
      try {
        setLoadingGrades(true);
        setErr("");

        const res = await axiosInstance.get("grades/");
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
    return (studentsText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [studentsText]);

  const selectedGradeLabel = useMemo(
    () => grades.find((g) => String(g.id) === String(gradeId))?.label || "",
    [grades, gradeId]
  );

  const fieldErrors = useMemo(
    () => ({
      message: !message.trim() ? "Task message is required." : "",
      dueDate: !dueDate ? "Due date is required." : "",
      gradeId: !gradeId ? "Please select a grade." : "",
      students:
        mode === "students" && studentsList.length === 0
          ? "Enter at least one student username."
          : "",
      quizzes: selectedQuizIds.length === 0 ? "Select at least one quiz." : "",
    }),
    [message, dueDate, gradeId, mode, studentsList.length, selectedQuizIds.length]
  );

  const inputClass = (field) => {
    const hasError = showFieldError(field) && fieldErrors[field];
    return [
      "mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2",
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-green-500 focus:ring-green-500",
    ].join(" ");
  };

  const FieldError = ({ field }) => {
    if (!showFieldError(field) || !fieldErrors[field]) return null;
    return <p className="mt-1 text-xs text-red-600">{fieldErrors[field]}</p>;
  };

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

  const selectChapterQuizzes = (chapterQuizIds) => {
    setSelectedQuizIds((prev) => Array.from(new Set([...prev, ...chapterQuizIds])));
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
    setSubmitAttempted(true);

    const v = validate();
    if (v) {
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
        setMessage("");
        setDueDate("");
        setSelectedQuizIds([]);
        setStudentsText("");
        setSubmitAttempted(false);
        setTouched({
          message: false,
          dueDate: false,
          gradeId: false,
          students: false,
        });

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

  const getQuizNumber = (title = "") => {
    const m = String(title).trim().match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : 999999;
  };

  const getChapterNumber = (chapter = "") => {
    const m = String(chapter).match(/Chapter\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : 999999;
  };

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

  const visibleQuizCount = useMemo(
    () =>
      groupedQuizzes.reduce(
        (sum, subj) => sum + subj.chapters.reduce((cSum, ch) => cSum + ch.quizzes.length, 0),
        0
      ),
    [groupedQuizzes]
  );

  const submitSummary = useMemo(() => {
    const parts = [];
    if (selectedQuizIds.length > 0) {
      parts.push(
        `${selectedQuizIds.length} quiz${selectedQuizIds.length === 1 ? "" : "zes"} selected`
      );
    }
    if (selectedGradeLabel) {
      parts.push(`${selectedGradeLabel} selected`);
    }
    if (mode === "grade" && gradeId) {
      parts.push("Whole grade targeted");
    } else if (mode === "students" && studentsList.length > 0) {
      parts.push(
        `${studentsList.length} student${studentsList.length === 1 ? "" : "s"} targeted`
      );
    }
    return parts;
  }, [selectedQuizIds.length, selectedGradeLabel, mode, gradeId, studentsList.length]);

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

  const navItems = useMemo(() => buildPublicNavItems(role), [role]);

  const secondaryBtnClass =
    "inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42b72a] sm:w-auto border-[#42b72a] bg-white text-[#42b72a] hover:bg-green-50";

  const primaryBtnClass =
    "inline-flex min-h-[44px] items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42b72a] disabled:opacity-60 bg-[#42b72a] hover:bg-green-700";

  const tabClass = (active) =>
    [
      "w-full rounded-full border px-4 py-2.5 text-sm font-semibold transition",
      active
        ? "border-[#42b72a] bg-[#42b72a] text-white shadow-sm"
        : "border-[#42b72a] bg-white text-[#42b72a] hover:bg-green-50",
    ].join(" ");

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Practicing Math Responsibly"
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
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42b72a]"
            style={{ backgroundColor: BRAND_GREEN }}
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] pb-24 text-gray-800 md:pb-0">
        <section className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-extrabold text-green-900 sm:text-3xl">Assign Task</h1>
            <p className="mt-1 text-sm text-gray-600">Send quizzes to a grade or specific students</p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Link to="/" className={secondaryBtnClass}>
              Back to Home
            </Link>
            <Link to="/teacher/tasks" className={secondaryBtnClass}>
              View My Tasks
            </Link>
          </div>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          )}
          {ok && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {ok}
            </div>
          )}

          <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-green-900">Task Details</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Task Message <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onBlur={() => markTouched("message")}
                    placeholder="Write a short instruction for students"
                    className={inputClass("message")}
                  />
                  <FieldError field="message" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Due Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onBlur={() => markTouched("dueDate")}
                    className={inputClass("dueDate")}
                  />
                  <FieldError field="dueDate" />
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t border-gray-100 pt-5">
              <h2 className="text-base font-semibold text-green-900">Target</h2>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => setMode("grade")} className={tabClass(mode === "grade")}>
                  Whole Grade
                </button>
                <button
                  type="button"
                  onClick={() => setMode("students")}
                  className={tabClass(mode === "students")}
                >
                  Specific Students
                </button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Select Grade <span className="text-red-600">*</span>
                </label>
                <select
                  value={gradeId}
                  onChange={(e) => setGradeId(e.target.value)}
                  onBlur={() => markTouched("gradeId")}
                  className={`${inputClass("gradeId")} bg-white`}
                >
                  <option value="">-- Select --</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <FieldError field="gradeId" />

                {loadingGrades && <div className="mt-1 text-sm text-gray-500">Loading grades...</div>}
                {!loadingGrades && grades.length === 0 && (
                  <div className="mt-1 text-sm text-gray-500">No grades found.</div>
                )}
              </div>
            </section>

            {mode === "students" && (
              <section className="space-y-3 border-t border-gray-100 pt-5">
                <h2 className="text-base font-semibold text-green-900">Students</h2>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Student Usernames <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={studentsText}
                    onChange={(e) => setStudentsText(e.target.value)}
                    onBlur={() => markTouched("students")}
                    placeholder="e.g., ali123, sara55, hamza7"
                    className={inputClass("students")}
                  />
                  <FieldError field="students" />
                </div>
              </section>
            )}

            <section className="space-y-3 border-t border-gray-100 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-green-900">Quizzes</h2>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={selectAll}
                    disabled={quizzes.length === 0}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#42b72a] bg-white px-3 py-2 text-sm font-medium text-[#42b72a] transition hover:bg-green-50 disabled:opacity-50"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={selectedQuizIds.length === 0}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span>
                  Visible: <span className="font-semibold text-gray-800">{visibleQuizCount}</span>
                </span>
                <span>
                  Selected: <span className="font-semibold text-green-900">{selectedQuizIds.length}</span>
                </span>
              </div>

              {submitAttempted && fieldErrors.quizzes ? (
                <p className="text-xs text-red-600">{fieldErrors.quizzes}</p>
              ) : null}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Filter by Subject</label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => {
                      setSubjectFilter(e.target.value);
                      setChapterFilter("");
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

              {loadingQuizzes && <div className="text-sm text-gray-600">Loading quizzes…</div>}

              {!loadingQuizzes && gradeId && quizzes.length === 0 && (
                <div className="text-sm text-gray-600">No quizzes found for this grade.</div>
              )}

              {!loadingQuizzes && !gradeId && (
                <div className="text-sm text-gray-500">Select a grade to load quizzes.</div>
              )}

              {!loadingQuizzes && quizzes.length > 0 && (
                <div className="space-y-4">
                  {groupedQuizzes.map((sub) => (
                    <div key={sub.subject} className="overflow-hidden rounded-lg border border-gray-200">
                      <div className="border-b bg-gray-50 px-4 py-2.5">
                        <div className="font-semibold text-gray-900">{sub.subject}</div>
                      </div>

                      <div className="space-y-4 p-3 sm:p-4">
                        {sub.chapters.map((ch) => (
                          <div key={ch.chapter}>
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="text-sm font-medium text-gray-700">{ch.chapter}</div>
                              <button
                                type="button"
                                onClick={() => selectChapterQuizzes(ch.quizzes.map((q) => q.id))}
                                className="rounded-full border border-[#42b72a] px-3 py-1 text-xs font-medium text-[#42b72a] transition hover:bg-green-50"
                              >
                                Select chapter
                              </button>
                            </div>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              {ch.quizzes.map((q) => {
                                const checked = selectedQuizIds.includes(q.id);

                                return (
                                  <label
                                    key={q.id}
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition hover:bg-gray-50 ${
                                      checked ? "border-[#42b72a] bg-green-50/40" : "border-gray-200"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-0.5 h-4 w-4 accent-[#42b72a]"
                                      checked={checked}
                                      onChange={() => toggleQuiz(q.id)}
                                    />
                                    <div className="min-w-0">
                                      <div className="font-medium text-gray-900">{q.title}</div>
                                      <div className="mt-0.5 text-xs text-gray-500">
                                        {q.chapter}
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

            <div className="hidden border-t border-gray-100 pt-4 sm:block">
              {submitSummary.length > 0 ? (
                <p className="mb-3 text-sm text-gray-600">{submitSummary.join(" · ")}</p>
              ) : null}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`${primaryBtnClass} w-full sm:w-auto`}
                >
                  {submitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-6px_16px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl space-y-2">
            {submitSummary.length > 0 ? (
              <p className="text-xs text-gray-600">{submitSummary.join(" · ")}</p>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700">
                Selected: <span className="font-semibold text-green-900">{selectedQuizIds.length}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className={`${primaryBtnClass} min-h-[44px] flex-1 px-5 py-2.5`}
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
