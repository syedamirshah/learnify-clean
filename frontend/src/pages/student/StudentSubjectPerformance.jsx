import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import { Link } from "react-router-dom";

const StudentSubjectPerformance = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    axiosInstance
      .get("student/subject-performance/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setRows(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load subject performance.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#f6fff6] px-4 md:px-6 py-8 text-gray-800">
      {/* Header */}
      <header className="max-w-[1100px] mx-auto mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" title="Go to Home">
              <img
                src={logo}
                alt="Learnify Home"
                className="h-20 md:h-24 w-auto hover:opacity-80 transition duration-200"
              />
            </Link>

            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-extrabold text-green-900 leading-tight">
                Subject-wise Performance
              </h2>
              <div className="text-sm md:text-base font-semibold text-green-800 italic">
                Your average vs class average (as provided by backend)
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

      {/* Main Card */}
      <div className="max-w-[1100px] mx-auto">
        <div className="rounded-2xl border-2 border-green-200 shadow-sm bg-white overflow-hidden">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-green-200 bg-green-50">
            <div className="text-xl font-black text-green-900 drop-shadow-[0_0.6px_0_rgba(0,0,0,0.15)]">
              Performance Table
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {loading ? (
              <div className="text-center py-10 text-green-800 font-semibold">
                Loading...
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <div className="inline-block px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold">
                  {error}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm md:text-base">
                  <thead className="bg-green-100 text-green-900 font-bold">
                    <tr>
                      <th className="px-4 py-3 border-b border-green-200 text-left">
                        Subject
                      </th>
                      <th className="px-4 py-3 border-b border-green-200 text-center">
                        Student Avg (%)
                      </th>
                      <th className="px-4 py-3 border-b border-green-200 text-center">
                        Class Avg (%)
                      </th>
                      <th className="px-4 py-3 border-b border-green-200 text-center">
                        Percentile
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {(rows || []).map((row, idx) => {
                      const isOverall = row.subject === "Overall Performance";
                      return (
                        <tr
                          key={idx}
                          className={`transition ${
                            isOverall
                              ? "bg-green-50 font-extrabold"
                              : idx % 2 === 0
                              ? "bg-white"
                              : "bg-green-50/40"
                          } hover:bg-green-50`}
                        >
                          <td className="px-4 py-3 border-b border-green-100 text-left">
                            {row.subject}
                          </td>
                          <td className="px-4 py-3 border-b border-green-100 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full border ${
                                isOverall
                                  ? "border-green-300 bg-white/80"
                                  : "border-green-200 bg-white/70"
                              } font-bold text-gray-900`}
                            >
                              {row.student_avg}%
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-green-100 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full border ${
                                isOverall
                                  ? "border-green-300 bg-white/80"
                                  : "border-green-200 bg-white/70"
                              } font-bold text-gray-900`}
                            >
                              {row.class_avg}%
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-green-100 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full border ${
                                isOverall
                                  ? "border-green-300 bg-white/80"
                                  : "border-green-200 bg-white/70"
                              } font-bold text-gray-900`}
                            >
                              {row.percentile}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-green-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Tip: Improve your weak subjects by attempting more quizzes.
              </div>
              <Link
                to="/student/quiz-history"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-green-200 bg-white/70 shadow-sm hover:shadow transition text-green-900 font-bold"
              >
                View Quiz History →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSubjectPerformance;