import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

/**
 * StudentTasks.jsx
 * - Fetches: GET /api/student/tasks/
 * - Shows tasks + quizzes (attempted / pending)
 *
 * Assumes axiosInstance.baseURL ends with `/api/`
 * so we call: axiosInstance.get("student/tasks/")
 *
 * If your quiz attempt route differs, adjust QUIZ_ATTEMPT_ROUTE below.
 */

// ✅ Adjust this if your frontend route is different
const QUIZ_ATTEMPT_ROUTE = (quizId) => `/student/quiz/${quizId}/start`; 
// alternative some projects use: (quizId) => `/quiz/${quizId}/attempt`;
// alternative backend direct start: `/student/quiz/${quizId}/start` (frontend route)

export default function StudentTasks() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({ tasks_count: 0, pending_quiz_count: 0 });

  // UI filters
  const [filter, setFilter] = useState("all"); // all | pending | completed
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());

  const fetchTasks = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await axiosInstance.get("student/tasks/"); // ✅ because baseURL = .../api/
      const data = res.data || {};
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setSummary(data.summary || { tasks_count: 0, pending_quiz_count: 0 });
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to load tasks.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleExpand = (taskId) => {
    setExpandedTaskIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(taskId)) copy.delete(taskId);
      else copy.add(taskId);
      return copy;
    });
  };

  const computed = useMemo(() => {
    const items = tasks.map((t) => {
      const quizzes = Array.isArray(t.quizzes) ? t.quizzes : [];
      const pendingCount = quizzes.filter((q) => !q.attempted).length;
      const completedCount = quizzes.filter((q) => q.attempted).length;
      const total = quizzes.length;

      return {
        ...t,
        _totalQuizzes: total,
        _pendingCount: pendingCount,
        _completedCount: completedCount,
        _isFullyCompleted: total > 0 && pendingCount === 0,
      };
    });

    let filtered = items;
    if (filter === "pending") {
      filtered = items.filter((t) => t._pendingCount > 0);
    } else if (filter === "completed") {
      filtered = items.filter((t) => t._isFullyCompleted);
    }

    return { items, filtered };
  }, [tasks, filter]);

  const handleAttempt = (quizId) => {
    navigate(QUIZ_ATTEMPT_ROUTE(quizId));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tasks assigned by your teacher (grade-wide or specifically to you).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchTasks}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Total Tasks</div>
          <div className="text-2xl font-semibold text-gray-900">{summary.tasks_count ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Pending Quizzes</div>
          <div className="text-2xl font-semibold text-gray-900">{summary.pending_quiz_count ?? 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mt-5">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending only" },
          { key: "completed", label: "Completed only" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full border text-sm ${
              filter === f.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div className="mt-6 rounded-xl border bg-white p-6 text-gray-700">
          Loading tasks...
        </div>
      )}

      {!loading && err && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {err}
        </div>
      )}

      {!loading && !err && computed.filtered.length === 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6 text-gray-700">
          No tasks found for this filter.
        </div>
      )}

      {/* Task Cards */}
      <div className="mt-6 space-y-4">
        {computed.filtered.map((task) => {
          const isExpanded = expandedTaskIds.has(task.task_id);
          const teacher = task.teacher || {};
          const assigned = task.assigned_to || {};
          const quizzes = Array.isArray(task.quizzes) ? task.quizzes : [];

          return (
            <div key={task.task_id} className="rounded-2xl border bg-white overflow-hidden">
              {/* Top bar */}
              <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      Task #{task.task_id}
                    </span>

                    {task._isFullyCompleted ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        Pending: {task._pendingCount}
                      </span>
                    )}

                    {assigned?.is_grade_wide ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        Grade-wide
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                        Assigned to you
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-lg font-semibold text-gray-900 break-words">
                    {task.message}
                  </div>

                  <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                    <div>
                      <span className="font-medium">Due:</span>{" "}
                      <span>{task.due_date || "N/A"}</span>
                    </div>

                    <div>
                      <span className="font-medium">Teacher:</span>{" "}
                      <span>
                        {teacher.full_name || teacher.username || "N/A"}
                        {teacher.school_name ? ` • ${teacher.school_name}` : ""}
                        {teacher.city ? ` • ${teacher.city}` : ""}
                      </span>
                    </div>

                    {assigned?.target_grade_name && (
                      <div>
                        <span className="font-medium">Grade:</span>{" "}
                        <span>{assigned.target_grade_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 md:justify-end">
                  <button
                    onClick={() => toggleExpand(task.task_id)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {isExpanded ? "Hide quizzes" : "View quizzes"} ({task._totalQuizzes})
                  </button>
                </div>
              </div>

              {/* Quizzes list */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-4 md:p-5">
                  {quizzes.length === 0 ? (
                    <div className="text-sm text-gray-600">No quizzes attached to this task.</div>
                  ) : (
                    <div className="space-y-3">
                      {quizzes.map((q) => (
                        <div
                          key={q.quiz_id}
                          className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border bg-white p-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-base font-semibold text-gray-900 break-words">
                                {q.title}
                              </div>
                              {q.attempted ? (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                  Attempted ✅
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                  Pending ⏳
                                </span>
                              )}
                            </div>

                            <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                              {q.grade && <span><span className="font-medium">Grade:</span> {q.grade}</span>}
                              {q.subject && <span><span className="font-medium">Subject:</span> {q.subject}</span>}
                              {q.chapter && <span><span className="font-medium">Chapter:</span> {q.chapter}</span>}
                            </div>
                          </div>

                          <div className="flex gap-2 md:justify-end">
                            <button
                              onClick={() => handleAttempt(q.quiz_id)}
                              className={`px-4 py-2 rounded-lg text-white ${
                                q.attempted ? "bg-gray-700 hover:bg-gray-800" : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {q.attempted ? "Re-attempt" : "Attempt Quiz"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}