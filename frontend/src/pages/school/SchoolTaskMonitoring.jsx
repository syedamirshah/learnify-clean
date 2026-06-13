import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";

function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full rounded-full bg-[#42b72a] transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export default function SchoolTaskMonitoring() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("school/task-monitoring/");
        setData(res.data || null);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load task monitoring."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = data?.summary || {};
  const tasks = data?.tasks || [];

  return (
    <SchoolPageShell
      title="Task Monitoring"
      subtitle="School-wide overview of active teacher tasks and completion progress."
    >
      {loading ? (
        <p className="text-emerald-800">Loading task monitoring...</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Active Tasks</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">{summary.active_tasks ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Completed Items</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">{summary.completed_items ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Pending Items</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">{summary.pending_items ?? 0}</p>
            </div>
          </section>

          <section className="space-y-4">
            {tasks.length === 0 ? (
              <p className="rounded-2xl border border-emerald-200 bg-white p-6 text-center text-gray-600 shadow-sm">
                No active tasks found for your school.
              </p>
            ) : (
              tasks.map((task) => (
                <article
                  key={task.task_id}
                  className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        {task.teacher_name}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-emerald-950">{task.message}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-800">
                        {task.completion_percentage}%
                      </p>
                      <p className="text-xs text-gray-500">completion</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProgressBar value={task.completion_percentage} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-700">
                    <span>
                      <strong>Completed:</strong> {task.completed_items}
                    </span>
                    <span>
                      <strong>Pending:</strong> {task.pending_items}
                    </span>
                    {task.teacher_username ? (
                      <Link
                        to={`/school/teacher/${task.teacher_username}`}
                        className="font-semibold text-green-700 hover:text-green-900"
                      >
                        View Teacher
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      )}
    </SchoolPageShell>
  );
}
