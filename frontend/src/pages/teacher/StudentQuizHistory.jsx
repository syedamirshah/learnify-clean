import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import logo from '../../assets/logo.png';

const StudentQuizHistory = () => {
  const { username } = useParams();

  const [quizResults, setQuizResults] = useState([]);
  const [sortedResults, setSortedResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');

  // sort state
  const [sortBy, setSortBy] = useState(null);          // 'quiz_title' | 'chapter' | 'attempted_on' | null
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // ---------- helpers ----------
  const safe = (v) => (v ?? '').toString().trim();

  // Parse "DD-MM-YYYY hh:mm AM/PM" -> epoch millis (fallback to Date.parse)
  const parseAttemptedOn = (s) => {
    if (!s) return 0;
    const m = s.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}) (AM|PM)$/);
    if (m) {
      let [, dd, mm, yyyy, hh, min, ap] = m;
      let H = parseInt(hh, 10) % 12;
      if (ap === 'PM') H += 12;
      const dt = new Date(
        parseInt(yyyy, 10),
        parseInt(mm, 10) - 1,
        parseInt(dd, 10),
        H,
        parseInt(min, 10),
        0,
        0
      );
      return dt.getTime();
    }
    // if the format ever changes, try native parsing instead of breaking
    const n = Date.parse(s);
    return Number.isNaN(n) ? 0 : n;
  };

  const cmpNatural = (a, b, key) =>
    safe(a[key]).localeCompare(safe(b[key]), undefined, { sensitivity: 'base', numeric: true });

  const applySort = (list, key, direction) => {
    if (!key) return [...list];
    const data = [...list];
    data.sort((a, b) => {
      let base = 0;
      if (key === 'attempted_on') {
        base = parseAttemptedOn(a.attempted_on) - parseAttemptedOn(b.attempted_on);
      } else {
        base = cmpNatural(a, b, key);
      }
      return direction === 'asc' ? base : -base;
    });
    return data;
  };

  const handleSort = (key) => {
    const nextDir = sortBy === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortBy(key);
    setSortDirection(nextDir);
    setSortedResults((prev) => applySort(prev, key, nextDir));
  };

  // ---------- data load ----------
  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axiosInstance.get(`teacher/student/${username}/quiz-history/`, { headers });

        const results = res.data.results || [];
        setQuizResults(results);
        setSortedResults(results); // initial order from backend is preserved until user sorts
        setStudentName(res.data.full_name || username);
      } catch (err) {
        console.error('Failed to fetch quiz history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizHistory();
  }, [username]);

  // re-apply current sort if backend data ever changes
  useEffect(() => {
    setSortedResults(applySort(quizResults, sortBy, sortDirection));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizResults]);

  const arrow = (key) =>
    sortBy === key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

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
              <th
                className="px-4 py-3 border cursor-pointer hover:bg-green-200"
                onClick={() => handleSort('quiz_title')}
                title="Sort by title"
              >
                Quiz Title{arrow('quiz_title')}
              </th>
              <th
                className="px-4 py-3 border cursor-pointer hover:bg-green-200"
                onClick={() => handleSort('chapter')}
                title="Sort by chapter"
              >
                Chapter{arrow('chapter')}
              </th>
              <th className="px-4 py-3 border">Subject</th>
              <th className="px-4 py-3 border">Grade</th>
              <th className="px-4 py-3 border">Score</th>
              <th className="px-4 py-3 border">Percentage</th>
              <th className="px-4 py-3 border">Grade</th>
              <th
                className="px-4 py-3 border cursor-pointer hover:bg-green-200"
                onClick={() => handleSort('attempted_on')}
                title="Sort by completion time"
              >
                Completed At{arrow('attempted_on')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-green-700">
                  Loading quiz history...
                </td>
              </tr>
            ) : sortedResults.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-600">
                  No quiz history available for this student.
                </td>
              </tr>
            ) : (
              sortedResults.map((result, idx) => (
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