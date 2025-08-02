import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';

const StudentQuizHistory = () => {
  const { username } = useParams();
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`/api/teacher/student/${username}/quiz-history/`, { headers });

        setQuizResults(res.data.results || []);
        setStudentName(res.data.full_name || username); // fallback if full name not available
      } catch (err) {
        console.error('Failed to fetch quiz history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizHistory();
  }, [username]);

  return (
    <div className="min-h-screen bg-white text-gray-800 px-6 py-8">
      {/* Header */}
      <header className="flex items-center gap-6 mb-6">
        <Link to="/" title="Go to Home">
          <img
            src={logo}
            alt="Learnify Logo"
            className="h-24 w-auto hover:opacity-80 transition duration-200"
          />
        </Link>
        <h2 className="text-3xl font-bold text-green-800">
          Quiz History for <span className="text-black">{studentName}</span>
        </h2>
      </header>

      {/* Quiz History Table */}
      <div className="overflow-x-auto border border-green-200 rounded-xl shadow-sm">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-green-100 text-green-900 font-semibold">
            <tr>
              <th className="px-4 py-3 border">Quiz Title</th>
              <th className="px-4 py-3 border">Chapter</th>
              <th className="px-4 py-3 border">Subject</th>
              <th className="px-4 py-3 border">Grade</th>
              <th className="px-4 py-3 border">Score</th>
              <th className="px-4 py-3 border">Percentage</th>
              <th className="px-4 py-3 border">Grade</th>
              <th className="px-4 py-3 border">Completed At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-green-700">
                  Loading quiz history...
                </td>
              </tr>
            ) : quizResults.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-600">
                  No quiz history available for this student.
                </td>
              </tr>
            ) : (
              quizResults.map((result, idx) => (
                <tr key={idx} className="text-center hover:bg-green-50 transition">
                  <td className="border px-3 py-2">{result.quiz_title}</td>
                  <td className="border px-3 py-2">{result.chapter}</td>
                  <td className="border px-3 py-2">{result.subject}</td>
                  <td className="border px-3 py-2">{result.grade}</td>
                  <td className="border px-3 py-2">
                    {result.marks_obtained} / {result.total_questions * result.marks_per_question}
                  </td>
                  <td className="border px-3 py-2">{result.percentage}%</td>
                  <td className="border px-3 py-2">{result.grade_letter}</td>
                  <td className="border px-3 py-2">{result.attempted_on}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          to="/teacher/assessment"
          className="text-green-700 font-medium hover:underline"
        >
          ← Back to Assessment Page
        </Link>
      </div>
    </div>
  );
};

export default StudentQuizHistory;