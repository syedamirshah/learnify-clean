import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";

const formatScore = (value) =>
  value === null || value === undefined ? "—" : `${value}%`;

export default function SchoolStudentSummary() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get(`school/student/${username}/summary/`);
        setData(res.data || null);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load student summary."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  const student = data?.student || {};

  return (
    <SchoolPageShell
      title={student.full_name || username}
      subtitle="Individual student performance summary"
    >
      {loading ? (
        <p className="text-emerald-800">Loading student summary...</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Username</p>
              <p className="mt-1 text-lg font-black text-emerald-950">{student.username}</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Grade</p>
              <p className="mt-1 text-lg font-black text-emerald-950">{student.grade || "—"}</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Quiz Count</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">{data.quiz_count ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Average Score</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">
                {formatScore(data.average_score)}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">Student Info</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-gray-500">Full Name</dt>
                <dd className="text-emerald-950">{student.full_name || "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Email</dt>
                <dd className="text-emerald-950">{student.email || "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Account Status</dt>
                <dd className="capitalize text-emerald-950">{student.account_status || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="flex flex-wrap gap-3">
            <Link
              to={`/school/student/${username}/quiz-history`}
              className="rounded-2xl bg-[#42b72a] px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
            >
              Quiz History
            </Link>
            <Link
              to={`/school/student/${username}/learning-diagnosis`}
              className="rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"
            >
              Learning Diagnosis
            </Link>
            <Link
              to="/school/users"
              className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Back to Users
            </Link>
          </section>
        </div>
      )}
    </SchoolPageShell>
  );
}
