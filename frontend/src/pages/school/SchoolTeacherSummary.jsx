import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";

const formatScore = (value) =>
  value === null || value === undefined ? "—" : `${value}%`;

export default function SchoolTeacherSummary() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get(`school/teacher/${username}/summary/`);
        setData(res.data || null);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load teacher summary."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  const teacher = data?.teacher || {};
  const attention = data?.students_requiring_attention || [];
  const recent = data?.recent_activity || [];

  return (
    <SchoolPageShell
      title={teacher.full_name || username}
      subtitle="Teacher classroom monitoring summary"
    >
      {loading ? (
        <p className="text-emerald-800">Loading teacher summary...</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white shadow-lg">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-100">Teacher</p>
            <h2 className="mt-1 text-3xl font-black">{teacher.full_name}</h2>
            <p className="mt-1 text-sm text-emerald-50">@{teacher.username}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Students</p>
                <p className="mt-1 text-2xl font-black">{data.students_count ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Average Score</p>
                <p className="mt-1 text-2xl font-black">{formatScore(data.average_student_score)}</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Active Tasks</p>
                <p className="mt-1 text-2xl font-black">{data.active_tasks_count ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Pending Work</p>
                <p className="mt-1 text-2xl font-black">{data.pending_task_items ?? 0}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">Students Requiring Attention</h2>
            {attention.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No students need attention right now.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Grade</th>
                      <th className="px-3 py-2">Reason</th>
                      <th className="px-3 py-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attention.map((row) => (
                      <tr key={row.student_id} className="border-t border-gray-100">
                        <td className="px-3 py-3 font-medium">{row.full_name}</td>
                        <td className="px-3 py-3">{row.grade || "—"}</td>
                        <td className="px-3 py-3">{row.reason}</td>
                        <td className="px-3 py-3 text-gray-600">{row.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">Recent Activity</h2>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No recent quiz activity.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {recent.map((item, index) => (
                  <li
                    key={`${item.student_name}-${item.quiz_title}-${index}`}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-gray-900">{item.student_name}</span> completed{" "}
                    <span className="font-medium text-emerald-900">{item.quiz_title}</span> —{" "}
                    <span className="font-bold text-emerald-800">{item.percentage}%</span>
                    {item.completed_at ? (
                      <span className="text-gray-500"> · {item.completed_at}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/school/teachers"
              className="rounded-2xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
            >
              Back to Teachers
            </Link>
            <Link
              to="/school/tasks"
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Task Monitoring
            </Link>
          </div>
        </div>
      )}
    </SchoolPageShell>
  );
}
