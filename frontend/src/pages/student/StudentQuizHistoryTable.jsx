import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const StudentQuizHistoryTable = () => {
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        const res = await axiosInstance.get('student/quiz-history/');
        setQuizResults(res.data.results || []);
        setStudentName(res.data.full_name || '');
      } catch (err) {
        console.error('Failed to fetch student quiz history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#f6fff6] px-4 py-8 text-gray-800">
      {/* Header */}
      <header className="flex items-center gap-5 mb-8 max-w-6xl mx-auto">
        <Link to="/" title="Go to Home">
          <img
            src={logo}
            alt="Learnify Logo"
            className="h-20 hover:opacity-80 transition"
          />
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold text-green-900">
            Quiz History
          </h2>
          {studentName && (
            <p className="text-sm italic text-green-700">
              {studentName}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto space-y-4">
        {loading ? (
          <div className="text-center py-10 text-green-700 font-semibold">
            Loading quiz history…
          </div>
        ) : quizResults.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            No quiz history available.
          </div>
        ) : (
          quizResults.map((result, idx) => {
            const totalMarks = result.total_questions * result.marks_per_question;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-green-200 shadow-sm hover:shadow-md transition p-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
                  
                  {/* LEFT: Quiz Info */}
                  <div>
                    <div className="text-lg font-extrabold text-green-900">
                      {result.quiz_title}
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {result.chapter} · {result.subject}
                    </div>
                    <div className="mt-1 text-xs italic text-gray-500">
                      {result.grade} · {result.attempted_on}
                    </div>
                  </div>

                  {/* RIGHT: Score Badges */}
                  <div className="flex flex-wrap justify-center md:justify-end gap-2 text-sm font-semibold">
                    <span className="px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-800">
                      Score: {result.marks_obtained}/{totalMarks}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800">
                      {result.percentage}%
                    </span>
                    <span className="px-3 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-800">
                      Grade: {result.grade_letter}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentQuizHistoryTable;