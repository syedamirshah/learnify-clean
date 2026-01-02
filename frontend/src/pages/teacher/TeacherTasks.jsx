import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

export default function TeacherTasks() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await axiosInstance.get("teacher/tasks/");
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        "Failed to load teacher tasks.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const computed = useMemo(() => {
    return tasks.map((t) => ({
      ...t,
      _quizCount: Array.isArray(t.quizzes) ? t.quizzes.length : 0,
    }));
  }, [tasks]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            My Tasks
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Tasks you created for students.
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
            to="/teacher/assign-task"
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            + Assign New Task
          </Link>

          <button
            onClick={fetchTasks}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
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

      {!loading && !err && computed.length === 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6 text-gray-700">
          No tasks created yet.
        </div>
      )}

      {/* List */}
      <div className="mt-6 space-y-4">
        {!loading &&
          !err &&
          computed.map((t) => (
            <div key={t.id} className="rounded-2xl border bg-white overflow-hidden">
              <div className="p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    Task #{t.id}
                  </span>

                  {t.is_active ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                      Inactive
                    </span>
                  )}

                  {t.target_grade ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      Grade-wide: {t.target_grade}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                      Student-specific: {t.target_students_count}
                    </span>
                  )}

                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    Quizzes: {t._quizCount}
                  </span>
                </div>

                <div className="mt-2 text-lg font-semibold text-gray-900">
                  {t.message}
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Due:</span>{" "}
                  {t.due_date ? String(t.due_date) : "N/A"}
                </div>

                {/* quizzes */}
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Quizzes
                  </div>

                  {Array.isArray(t.quizzes) && t.quizzes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {t.quizzes.map((qt, idx) => (
                        <span
                          key={`${t.id}-q-${idx}`}
                          className="text-xs px-3 py-1 rounded-full border bg-gray-50 text-gray-700"
                        >
                          {qt}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No quizzes attached.</div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}