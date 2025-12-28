import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

const StudentQuizHistoryTable = () => {
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        const res = await axiosInstance.get("student/quiz-history/");
        setQuizResults(res.data.results || []);
        setStudentName(res.data.full_name || "");
      } catch (err) {
        console.error("Failed to fetch student quiz history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizHistory();
  }, []);

  // ✅ keep your existing total calc (same logic) but centralize it for UI
  const rows = useMemo(() => {
    return (quizResults || []).map((r) => {
      const totalMarks = (r.total_questions || 0) * (r.marks_per_question || 0);
      return { ...r, totalMarks };
    });
  }, [quizResults]);

  return (
    <div className="min-h-screen bg-[#f6fff6] text-gray-800 px-4 md:px-6 py-8">
      {/* Header */}
      <header className="max-w-[1200px] mx-auto mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" title="Go to Home">
              <img
                src={logo}
                alt="Learnify Logo"
                className="h-20 md:h-24 w-auto hover:opacity-80 transition duration-200"
              />
            </Link>

            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-extrabold text-green-900 leading-tight">
                Your Quiz History
              </h2>
              <div className="text-sm md:text-base font-semibold text-green-800 italic truncate">
                {studentName ? `Student: ${studentName}` : " "}
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-white/70 shadow-sm hover:shadow transition text-green-900 font-bold"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Card (Landing style) */}
      <div className="max-w-[1200px] mx-auto">
        <div className="rounded-2xl border-2 border-green-200 shadow-sm bg-white overflow-hidden">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-green-200 bg-green-50">
            <div className="text-xl font-black text-green-900 drop-shadow-[0_0.6px_0_rgba(0,0,0,0.15)]">
              Completed Quizzes
            </div>
            <div className="text-sm text-gray-700 mt-1">
              Latest attempt is shown per quiz (as your backend returns).
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm md:text-base">
              <thead className="bg-green-100 text-green-900 font-bold">
                <tr>
                  <th className="px-4 py-3 border-b border-green-200 text-left">Quiz</th>
                  <th className="px-4 py-3 border-b border-green-200 text-left">Chapter</th>
                  <th className="px-4 py-3 border-b border-green-200 text-left">Subject</th>
                  <th className="px-4 py-3 border-b border-green-200 text-center">Grade</th>
                  <th className="px-4 py-3 border-b border-green-200 text-center">Score</th>
                  <th className="px-4 py-3 border-b border-green-200 text-center">%</th>
                  <th className="px-4 py-3 border-b border-green-200 text-center">Letter</th>
                  <th className="px-4 py-3 border-b border-green-200 text-center">Completed</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-green-800 font-semibold">
                      Loading quiz history...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-gray-700">
                      No quiz history available.
                    </td>
                  </tr>
                ) : (
                  rows.map((result, idx) => (
                    <tr
                      key={idx}
                      className={`transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-green-50/40"
                      } hover:bg-green-50`}
                    >
                      <td className="px-4 py-3 border-b border-green-100 font-semibold text-gray-900">
                        {result.quiz_title}
                      </td>

                      <td className="px-4 py-3 border-b border-green-100 text-gray-800">
                        {result.chapter}
                      </td>

                      <td className="px-4 py-3 border-b border-green-100 text-gray-800">
                        {result.subject}
                      </td>

                      <td className="px-4 py-3 border-b border-green-100 text-center font-semibold">
                        {result.grade}
                      </td>

                      <td className="px-4 py-3 border-b border-green-100 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/80 border border-green-200 text-gray-800 font-bold">
                            {result.marks_obtained} / {result.totalMarks}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 border-b border-green-100 text-center font-bold text-gray-900">
                        {result.percentage}%
                      </td>

                      <td className="px-4 py-3 border-b border-green-100 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-white/80 border border-green-200 text-gray-900 font-extrabold">
                          {result.grade_letter}
                        </span>
                      </td>

                      <td className="px-4 py-3 border-b border-green-100 text-center text-gray-800">
                        {result.attempted_on}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-green-200 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-700">
                Tip: Click any quiz from Landing Page to attempt again.
              </div>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-green-200 bg-white/70 shadow-sm hover:shadow transition text-green-900 font-bold"
              >
                Go to Quizzes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuizHistoryTable;