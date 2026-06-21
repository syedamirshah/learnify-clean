import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";

const formatScore = (value) =>
  value === null || value === undefined ? "—" : `${value}%`;

const getStatusBadge = (status, isActive) => {
  if (!isActive || status === "inactive") {
    return { label: "Inactive", className: "bg-gray-200 text-gray-700" };
  }
  if (status === "expired") {
    return { label: "Expired", className: "bg-amber-100 text-amber-900 ring-1 ring-amber-200" };
  }
  return { label: "Active", className: "bg-green-100 text-green-800 ring-1 ring-green-200" };
};

const getOverallBadge = (student) => {
  const done = student.completed_count ?? 0;
  const total = student.total_quizzes ?? 0;
  if (!total) return { label: "No quizzes", className: "bg-gray-100 text-gray-600" };
  if (done === total) return { label: "Completed", className: "bg-green-100 text-green-800 ring-1 ring-green-200" };
  if (done === 0) return { label: "Not started", className: "bg-red-100 text-red-800 ring-1 ring-red-200" };
  return {
    label: `${done}/${total} completed`,
    className: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200",
  };
};

function QuizProgressBadge({ quiz }) {
  if (quiz.completed) {
    const marks =
      quiz.marks_obtained != null && quiz.total_marks != null
        ? `${quiz.marks_obtained}/${quiz.total_marks}`
        : "—";
    const pct = quiz.percentage != null ? `${quiz.percentage}%` : "";
    const letter = quiz.grade ? ` (${quiz.grade})` : "";
    return (
      <span className="inline-flex flex-wrap items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 ring-1 ring-green-200">
        <span>Done</span>
        <span className="text-green-900">
          — {marks}
          {pct ? ` (${pct})` : ""}
          {letter}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200">
      Not Done
    </span>
  );
}

function StudentProgressRow({ student }) {
  const overall = getOverallBadge(student);
  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      <td className="px-3 py-3 font-medium text-emerald-950">{student.full_name}</td>
      <td className="px-3 py-3 text-center text-gray-700">{student.grade || "—"}</td>
      <td className="px-3 py-3">
        <div className="flex flex-col gap-1.5">
          {(student.quizzes || []).map((quiz) => (
            <div key={`${student.id}-${quiz.quiz_id}`} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-gray-700">{quiz.quiz_title}:</span>
              <QuizProgressBadge quiz={quiz} />
            </div>
          ))}
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${overall.className}`}>
          {overall.label}
        </span>
      </td>
    </tr>
  );
}

export default function SchoolTeacherMonitoringDetail() {
  const { teacherId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get(`school/teachers/${teacherId}/`);
        setData(res.data || null);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load teacher monitoring details."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teacherId]);

  const teacher = data?.teacher || {};
  const tasks = data?.tasks || [];

  const toggleTask = (taskId) => {
    setExpandedTasks((current) => ({ ...current, [taskId]: !current[taskId] }));
  };

  return (
    <SchoolPageShell
      title={teacher.full_name || "Teacher Details"}
      subtitle="Read-only view of teacher assignments and student progress."
    >
      {loading ? (
        <p className="text-emerald-800">Loading teacher details...</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl bg-gradient-to-r from-[#42b72a] to-green-700 p-6 text-white shadow-lg">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-100">Teacher Summary</p>
            <h2 className="mt-1 text-3xl font-black">{teacher.full_name}</h2>
            <p className="mt-1 text-sm text-emerald-50">@{teacher.username}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Students</p>
                <p className="mt-1 text-2xl font-black">{data.students_count ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Tasks Created</p>
                <p className="mt-1 text-2xl font-black">{data.tasks_created_count ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Class Average</p>
                <p className="mt-1 text-2xl font-black">{formatScore(data.class_average)}</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Active Tasks</p>
                <p className="mt-1 text-2xl font-black">{data.active_tasks_count ?? 0}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">Tasks Created</h2>
            {tasks.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">This teacher has not created any tasks yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {tasks.map((task) => {
                  const status = getStatusBadge(task.status, task.is_active);
                  const isExpanded = Boolean(expandedTasks[task.task_id]);
                  const students = task.assigned_students || [];
                  return (
                    <article
                      key={task.task_id}
                      className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTask(task.task_id)}
                        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left hover:bg-emerald-50"
                      >
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                            Task #{task.task_id}
                          </p>
                          <h3 className="mt-1 text-base font-black text-emerald-950">{task.message}</h3>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                            <span>Due: {task.due_date || "—"}</span>
                            <span>Created: {task.created_at || "—"}</span>
                            <span>Grade: {task.target_grade || "—"}</span>
                            <span>Students: {task.target_students_count ?? students.length}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
                          {status.label}
                        </span>
                      </button>

                      {isExpanded ? (
                        <div className="border-t border-emerald-100 bg-white px-4 py-4">
                          <h4 className="mb-3 text-sm font-bold text-emerald-950">Student Progress</h4>
                          {students.length === 0 ? (
                            <p className="text-sm text-gray-600">No students assigned to this task.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                    <th className="px-3 py-2">Student</th>
                                    <th className="px-3 py-2 text-center">Grade</th>
                                    <th className="px-3 py-2">Quiz Progress</th>
                                    <th className="px-3 py-2 text-center">Task Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {students.map((student) => (
                                    <StudentProgressRow key={student.id} student={student} />
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
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
              className="rounded-2xl bg-[#42b72a] px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
            >
              Task Monitoring
            </Link>
          </div>
        </div>
      )}
    </SchoolPageShell>
  );
}
