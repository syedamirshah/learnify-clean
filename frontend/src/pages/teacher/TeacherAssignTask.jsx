import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

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

  // ui states
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // ✅ load grades list from landing/quizzes (no new backend endpoint needed)
  useEffect(() => {
    const loadGrades = async () => {
      try {
        setLoadingGrades(true);
        setErr("");

        // Your LandingPage uses API = VITE_API_BASE_URL and calls landing/quizzes/
        // But axiosInstance baseURL is /api/, so we can call it here safely:
        const res = await axiosInstance.get("landing/quizzes/");
        const data = res.data || [];

        // Expecting array like: [{ grade: "Grade 1", grade_id: 1, subjects: [...] }, ...]
        // If backend doesn't provide grade_id, we fallback to grade name (but your teacher/quizzes needs grade_id)
        const gradeItems = Array.isArray(data) ? data : [];

        const normalized = gradeItems
          .map((g) => ({
            label: g.grade,
            id: g.grade_id || g.id || "", // try common keys
          }))
          .filter((g) => g.label);

        setGrades(normalized);
      } catch (e) {
        console.error(e);
        setErr("Failed to load grades for task assignment.");
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
        return;
      }

      try {
        setLoadingQuizzes(true);
        setErr("");
        setOk("");

        const res = await axiosInstance.get(`teacher/quizzes/?grade=${gradeId}`);
        setQuizzes(Array.isArray(res.data) ? res.data : []);
        setSelectedQuizIds([]);
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

  const selectAll = () => setSelectedQuizIds(quizzes.map((q) => q.id));
  const clearAll = () => setSelectedQuizIds([]);

  const validate = () => {
    if (!message.trim()) return "Message is required.";
    if (!dueDate) return "Due date is required.";
    if (!Array.isArray(selectedQuizIds) || selectedQuizIds.length === 0)
      return "Please select at least 1 quiz.";
    if (mode === "grade" && !gradeId) return "Please choose a grade.";
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

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Assign Task
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Create a task and attach quizzes for students to attempt.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Back to Home
          </Link>
          <Link
            to="/teacher/tasks"
            className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
          >
            View My Tasks
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {err && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {err}
        </div>
      )}
      {ok && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          {ok}
        </div>
      )}

      {/* Form */}
      <div className="mt-5 rounded-2xl border bg-white p-4 md:p-6 space-y-5">
        {/* Message + Due date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Task Message
            </label>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Complete these quizzes before Friday."
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Assignment Mode */}
        <div className="rounded-xl border bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Assign To
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("grade")}
              className={`px-4 py-2 rounded-full border text-sm ${
                mode === "grade"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Whole Grade
            </button>

            <button
              type="button"
              onClick={() => setMode("students")}
              className={`px-4 py-2 rounded-full border text-sm ${
                mode === "students"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Specific Students
            </button>
          </div>

          {/* Grade selector */}
          {mode === "grade" && (
            <div className="mt-3">
              <label className="text-sm font-medium text-gray-700">
                Select Grade
              </label>
              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="">-- Select --</option>
                {grades.map((g) => (
                  <option key={g.label} value={g.id}>
                    {g.label} {g.id ? "" : "(no id)"}
                  </option>
                ))}
              </select>

              {loadingGrades && (
                <div className="text-sm text-gray-500 mt-2">
                  Loading grades...
                </div>
              )}
              {!loadingGrades && grades.length === 0 && (
                <div className="text-sm text-gray-500 mt-2">
                  No grades found from landing/quizzes.
                </div>
              )}
            </div>
          )}

          {/* Students input */}
          {mode === "students" && (
            <div className="mt-3">
              <label className="text-sm font-medium text-gray-700">
                Student Usernames (comma separated)
              </label>
              <input
                value={studentsText}
                onChange={(e) => setStudentsText(e.target.value)}
                placeholder="e.g., ali123, sara55, hamza7"
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-2">
                Only students in your <b>school + city</b> will be accepted by the backend.
              </div>
            </div>
          )}
        </div>

        {/* Quizzes */}
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-gray-700">
                Select Quizzes
              </div>
              <div className="text-xs text-gray-500">
                {mode === "grade"
                  ? "Choose a grade to load quizzes."
                  : "Choose any grade to load quizzes, then assign to specific students."}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                disabled={quizzes.length === 0}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={selectedQuizIds.length === 0}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          {loadingQuizzes && (
            <div className="mt-3 text-sm text-gray-600">Loading quizzes…</div>
          )}

          {!loadingQuizzes && quizzes.length === 0 && (
            <div className="mt-3 text-sm text-gray-600">
              No quizzes loaded yet.
            </div>
          )}

          {!loadingQuizzes && quizzes.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {quizzes.map((q) => {
                const checked = selectedQuizIds.includes(q.id);
                return (
                  <button
                    type="button"
                    key={q.id}
                    onClick={() => toggleQuiz(q.id)}
                    className={`text-left rounded-xl border p-3 hover:bg-gray-50 transition ${
                      checked ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-gray-900">{q.title}</div>
                      <div className="text-sm">{checked ? "✅" : "⬜"}</div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {q.grade ? `Grade: ${q.grade}` : ""}
                      {q.subject ? ` • Subject: ${q.subject}` : ""}
                      {q.chapter ? ` • Chapter: ${q.chapter}` : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}