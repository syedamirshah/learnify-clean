import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";

export default function SchoolStudentQuizHistory() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get(`school/student/${username}/quiz-history/`);
        setStudentName(res.data?.full_name || username);
        setResults(res.data?.results || []);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load quiz history."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  return (
    <SchoolPageShell
      title="Student Quiz History"
      subtitle={`Quiz attempts for ${studentName || username}`}
    >
      {loading ? (
        <p className="text-emerald-800">Loading quiz history...</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : results.length === 0 ? (
        <p className="rounded-2xl border border-emerald-200 bg-white p-6 text-center text-gray-600 shadow-sm">
          No quiz history available for this student.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl border border-emerald-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-100 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Quiz</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Chapter</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Attempted</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.attempt_id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-semibold text-emerald-950">{result.quiz_title}</td>
                    <td className="px-4 py-3">{result.subject || "—"}</td>
                    <td className="px-4 py-3">{result.chapter || "—"}</td>
                    <td className="px-4 py-3 font-bold text-emerald-800">{result.percentage}%</td>
                    <td className="px-4 py-3">{result.grade_letter}</td>
                    <td className="px-4 py-3 text-gray-600">{result.attempted_on}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
