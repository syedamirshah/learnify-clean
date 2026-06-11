import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";

const formatScore = (value) =>
  value === null || value === undefined ? "—" : `${value}%`;

function monitoringTone(row) {
  if (row.average_student_score != null && row.average_student_score < 50) {
    return "red";
  }
  if (row.attention_students_count > 0 || row.pending_task_items > 0) {
    return "yellow";
  }
  return "green";
}

const toneStyles = {
  green: "border-emerald-200 bg-emerald-50",
  yellow: "border-amber-200 bg-amber-50",
  red: "border-red-200 bg-red-50",
};

export default function SchoolTeacherAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("school/teacher-analytics/");
        setData(res.data || null);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load teacher analytics."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = data?.summary || {};
  const teachers = data?.teachers || [];

  return (
    <SchoolPageShell
      title="Teachers"
      subtitle="Monitor classroom progress and task activity. This is school monitoring, not teacher evaluation."
    >
      {loading ? (
        <p className="text-emerald-800">Loading teacher analytics...</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Teachers</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">{summary.teachers ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Avg Teacher Score</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {formatScore(summary.average_school_teacher_score)}
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Active Tasks</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {summary.total_active_tasks ?? 0}
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Pending Items</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {summary.total_pending_items ?? 0}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">Teacher Overview</h2>
            {teachers.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No teachers found for your school.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2">Teacher</th>
                      <th className="px-3 py-2">Students</th>
                      <th className="px-3 py-2">Average Score</th>
                      <th className="px-3 py-2">Active Tasks</th>
                      <th className="px-3 py-2">Pending Work</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((row) => {
                      const tone = monitoringTone(row);
                      return (
                        <tr
                          key={row.id}
                          className={`border-t border-gray-100 ${toneStyles[tone]}`}
                        >
                          <td className="px-3 py-3 font-semibold text-emerald-950">{row.full_name}</td>
                          <td className="px-3 py-3">{row.students_count}</td>
                          <td className="px-3 py-3 font-semibold">{formatScore(row.average_student_score)}</td>
                          <td className="px-3 py-3">{row.active_tasks_count}</td>
                          <td className="px-3 py-3">{row.pending_task_items}</td>
                          <td className="px-3 py-3 text-center">
                            <Link
                              to={`/school/teacher/${row.username}`}
                              className="inline-flex rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </SchoolPageShell>
  );
}
