import React from "react";
import { Link } from "react-router-dom";
import { formatSchoolScore, getGradePreview } from "../../utils/schoolDashboardHelpers";

export default function SchoolGradePreview({ gradeSnapshot }) {
  const grades = getGradePreview(gradeSnapshot, 4);

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-black text-emerald-950">Grade Snapshot</h2>
        <Link
          to="/school/analytics"
          className="text-sm font-bold text-green-700 hover:text-green-900"
        >
          View Full Analytics →
        </Link>
      </div>
      {grades.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">No grade data available yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {grades.map((grade) => (
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
                  <span className="font-semibold">Avg Score:</span>{" "}
                  {formatSchoolScore(grade.average_score)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
