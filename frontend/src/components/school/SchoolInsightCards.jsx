import React from "react";
import { Link } from "react-router-dom";
import {
  extractTopStudent,
  formatSchoolScore,
  getActiveTasksSummary,
  getAttentionSummary,
} from "../../utils/schoolDashboardHelpers";

function InsightCard({ label, value, hint, to }) {
  const content = (
    <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm ring-1 ring-emerald-100 transition hover:border-emerald-300">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-black text-emerald-950 sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}

export default function SchoolInsightCards({ analytics, taskMonitoring }) {
  const overview = analytics?.overview || {};
  const topStudent = extractTopStudent(analytics?.top_students);
  const attention = getAttentionSummary(analytics?.students_requiring_attention);
  const activeTasks = getActiveTasksSummary(taskMonitoring);

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <InsightCard
        label="Average School Performance"
        value={formatSchoolScore(overview.average_score)}
        hint="School-wide quiz average"
      />
      <InsightCard
        label="Top Student"
        value={topStudent.displayName}
        hint={
          topStudent.student
            ? `Score: ${topStudent.scoreLabel}`
            : "Complete quizzes to rank students"
        }
        to={topStudent.student ? `/school/student/${topStudent.student.username}` : undefined}
      />
      <InsightCard
        label="Students Requiring Attention"
        value={attention.displayValue}
        hint={attention.hint}
        to={attention.count > 0 ? "#school-attention-table" : undefined}
      />
      <InsightCard
        label="Active Tasks"
        value={activeTasks.displayValue}
        hint={activeTasks.hint}
        to="/school/tasks"
      />
    </section>
  );
}
