import React from "react";
import { Link } from "react-router-dom";

const formatScore = (value) =>
  value === null || value === undefined ? "—" : `${value}%`;

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm ring-1 ring-emerald-100">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-emerald-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function SchoolAnalyticsSections({ data, showLinks = true, mode = "full" }) {
  if (!data) return null;

  const overview = data.overview || {};
  const gradeSnapshot = data.grade_snapshot || [];
  const attention = data.students_requiring_attention || [];
  const topStudents = data.top_students || [];
  const isDashboard = mode === "dashboard";
  const gradeTitle = isDashboard ? "Grade Performance" : "Grade Snapshot";

  const gradeSection = (
    <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-emerald-950">{gradeTitle}</h2>
      {gradeSnapshot.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">No grade data available yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gradeSnapshot.map((grade) => (
            <div
              key={grade.grade}
              className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-4"
            >
              <p className="text-sm font-black text-emerald-950">{grade.grade}</p>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Students:</span> {grade.students}
                </p>
                <p>
                  <span className="font-semibold">Avg Score:</span> {formatScore(grade.average_score)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const attentionSection = (
    <section
      id={isDashboard ? "school-attention-table" : undefined}
      className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-black text-emerald-950">Students Requiring Attention</h2>
      {attention.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">No students need attention right now.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Average Score</th>
                {showLinks ? <th className="px-3 py-2 text-center">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {attention.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-3 py-3 font-medium text-gray-900">{row.full_name}</td>
                  <td className="px-3 py-3 text-gray-700">{row.username}</td>
                  <td className="px-3 py-3 font-semibold text-amber-800">
                    {formatScore(row.average_score)}
                  </td>
                  {showLinks ? (
                    <td className="px-3 py-3 text-center">
                      <Link
                        to={`/school/student/${row.username}`}
                        className="inline-flex rounded-xl bg-[#42b72a] px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                      >
                        View Summary
                      </Link>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const topStudentsSection = (
    <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-emerald-950">Top Students</h2>
      {topStudents.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">No ranked students yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Average Score</th>
                {showLinks ? <th className="px-3 py-2 text-center">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {topStudents.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-3 py-3 font-medium text-gray-900">{row.full_name}</td>
                  <td className="px-3 py-3 font-bold text-emerald-800">
                    {formatScore(row.average_score)}
                  </td>
                  {showLinks ? (
                    <td className="px-3 py-3 text-center">
                      <Link
                        to={`/school/student/${row.username}`}
                        className="inline-flex rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-50"
                      >
                        View Summary
                      </Link>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      {mode === "full" ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <MetricCard label="Students" value={overview.students ?? 0} />
          <MetricCard label="Teachers" value={overview.teachers ?? 0} />
          <MetricCard
            label="Average School Performance"
            value={formatScore(overview.average_score)}
          />
        </section>
      ) : null}

      {isDashboard ? (
        <>
          {gradeSection}
          {topStudentsSection}
          {attentionSection}
        </>
      ) : (
        <>
          {gradeSection}
          {attentionSection}
          {topStudentsSection}
        </>
      )}
    </div>
  );
}
