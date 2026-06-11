import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";

const statusBadge = {
  strong: "bg-emerald-100 text-emerald-900",
  improving: "bg-amber-100 text-amber-900",
  weak: "bg-red-100 text-red-800",
};

export default function SchoolStudentLearningDiagnosis() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get(`school/student/${username}/learning-diagnosis/`);
        setData(res.data || null);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load learning diagnosis."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  const hasData = data?.has_data && (data?.overall?.total_attempted_quizzes || 0) > 0;

  return (
    <SchoolPageShell
      title="Learning Diagnosis"
      subtitle={data?.full_name ? `Insights for ${data.full_name}` : `Insights for ${username}`}
    >
      {loading ? (
        <p className="text-emerald-800">Loading learning diagnosis...</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : !hasData ? (
        <p className="rounded-2xl border border-emerald-200 bg-white p-6 text-center text-gray-600 shadow-sm">
          This student has not completed enough quizzes for a learning diagnosis yet.
        </p>
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white shadow-lg">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-100">
              Learning Health Score
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-black">{data.learning_health_score ?? 0}</span>
              <span className="pb-2 text-2xl font-bold text-white/80">/ 100</span>
            </div>
            <p className="mt-3 text-sm font-semibold">Status: {data.health_status}</p>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Quizzes</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {data.overall?.total_attempted_quizzes ?? 0}
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Average</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {data.overall?.overall_average_percentage ?? 0}%
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Strong Chapters</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {data.overall?.strong_chapters_count ?? 0}
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Weak Chapters</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {data.overall?.weak_chapters_count ?? 0}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">Chapter Mastery</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2">Chapter</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Average</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.chapter_mastery || []).map((chapter) => (
                    <tr key={`${chapter.chapter_id}-${chapter.chapter_name}`} className="border-t border-gray-100">
                      <td className="px-3 py-3 font-medium">{chapter.chapter_name}</td>
                      <td className="px-3 py-3">{chapter.subject_name || "—"}</td>
                      <td className="px-3 py-3 font-semibold">{chapter.average_percentage}%</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${
                            statusBadge[chapter.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {chapter.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {data.parent_friendly_summary ? (
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <h2 className="text-lg font-black text-emerald-950">Summary</h2>
              <p className="mt-3 text-sm leading-relaxed text-emerald-950">
                {data.parent_friendly_summary}
              </p>
            </section>
          ) : null}

          <Link
            to={`/school/student/${username}`}
            className="inline-flex rounded-2xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
          >
            Back to Summary
          </Link>
        </div>
      )}
    </SchoolPageShell>
  );
}
