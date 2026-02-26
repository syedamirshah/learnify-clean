import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import logo from '../../assets/logo.png';
import AppLayout from '../../components/layout/AppLayout';

const StudentQuizHistory = () => {
  const { username } = useParams();

  const [quizResults, setQuizResults] = useState([]);
  const [sortedResults, setSortedResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [role, setRole] = useState(localStorage.getItem('user_role'));
  const [userFullName, setUserFullName] = useState(localStorage.getItem('user_full_name') || '');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // sort state
  const [sortBy, setSortBy] = useState(null); // 'quiz_title' | 'chapter' | 'attempted_on' | null
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

  useEffect(() => {
    setRole(localStorage.getItem('user_role'));
    setUserFullName(localStorage.getItem('user_full_name') || '');
  }, []);

  // re-apply current sort if backend data ever changes
  useEffect(() => {
    setSortedResults(applySort(quizResults, sortBy, sortDirection));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizResults]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_full_name');
    localStorage.removeItem('account_status');
    localStorage.removeItem('role');
    localStorage.removeItem('user_grade');
    navigate('/', { replace: true });
  };

  const navItems = useMemo(
    () => [
      { key: 'home', label: 'Home', href: '/' },
      { key: 'why-join', label: 'Why Join Learnify?', href: '/why-join' },
      ...(role === 'teacher'
        ? [
            {
              key: 'assessment',
              label: 'Assessment',
              href: '/teacher/assessment',
              children: [
                { key: 'student-results', label: 'Student Results', href: '/teacher/assessment' },
                { key: 'teacher-tasks', label: 'My Tasks', href: '/teacher/tasks' },
                { key: 'assign-task', label: 'Assign Task', href: '/teacher/assign-task' },
              ],
            },
          ]
        : []),
      { key: 'honor-board', label: 'Honor Board', href: '/honor-board' },
      { key: 'membership', label: 'Membership', href: '/membership' },
      { key: 'help-center', label: 'Help Center', href: '/help-center' },
    ],
    [role]
  );

  const arrow = (key) =>
    sortBy === key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Learning with Responsibility"
      isAuthenticated={Boolean(role)}
      userFullName={userFullName}
      navItems={navItems}
      isMobileDrawerOpen={mobileDrawerOpen}
      onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
      onLogoutClick={handleLogout}
      mobileAuthContent={
        role ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] text-gray-800">
        <section className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-extrabold text-green-900 sm:text-3xl">Student Quiz History</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              Quiz attempts for <span className="font-semibold text-gray-800">{studentName}</span>
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6 lg:px-8 lg:py-8">
          {loading ? (
            <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="font-semibold text-green-700">Loading quiz history...</p>
            </div>
          ) : sortedResults.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="font-semibold text-gray-700">No quiz history available for this student.</p>
            </div>
          ) : (
            <>
              <div className="block md:hidden space-y-3">
                {sortedResults.map((result, idx) => (
                  <article key={idx} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 border-b border-gray-100 pb-2">
                      <h3 className="text-base font-bold text-green-900 break-words">{result.quiz_title}</h3>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Chapter</span>
                        <span className="text-right font-semibold text-gray-800 break-words">{result.chapter}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Subject</span>
                        <span className="text-right font-semibold text-gray-800 break-words">{result.subject}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Grade</span>
                        <span className="text-right font-semibold text-gray-800">{result.grade}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Score</span>
                        <span className="text-right font-semibold text-gray-800">
                          {result.marks_obtained} / {result.total_questions * result.marks_per_question}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Percentage</span>
                        <span className="text-right font-semibold text-gray-800">{result.percentage}%</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Grade Letter</span>
                        <span className="text-right font-semibold text-gray-800">{result.grade_letter}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Completed At</span>
                        <span className="text-right font-semibold text-gray-800 break-words">{result.attempted_on}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden md:block">
                <div className="overflow-x-auto rounded-xl border border-green-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-green-100 text-green-900 font-semibold">
                      <tr>
                        <th
                          className="cursor-pointer border px-4 py-3 text-left hover:bg-green-200"
                          onClick={() => handleSort('quiz_title')}
                          title="Sort by title"
                        >
                          Quiz Title{arrow('quiz_title')}
                        </th>
                        <th
                          className="cursor-pointer border px-4 py-3 text-left hover:bg-green-200"
                          onClick={() => handleSort('chapter')}
                          title="Sort by chapter"
                        >
                          Chapter{arrow('chapter')}
                        </th>
                        <th className="border px-4 py-3 text-left">Subject</th>
                        <th className="border px-4 py-3 text-left">Grade</th>
                        <th className="border px-4 py-3 text-center">Score</th>
                        <th className="border px-4 py-3 text-center">Percentage</th>
                        <th className="border px-4 py-3 text-center">Grade</th>
                        <th
                          className="cursor-pointer border px-4 py-3 text-left hover:bg-green-200"
                          onClick={() => handleSort('attempted_on')}
                          title="Sort by completion time"
                        >
                          Completed At{arrow('attempted_on')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResults.map((result, idx) => (
                        <tr key={idx} className="transition hover:bg-green-50">
                          <td className="border px-4 py-3 text-left">{result.quiz_title}</td>
                          <td className="border px-4 py-3 text-left">{result.chapter}</td>
                          <td className="border px-4 py-3 text-left">{result.subject}</td>
                          <td className="border px-4 py-3 text-left">{result.grade}</td>
                          <td className="border px-4 py-3 text-center">
                            {result.marks_obtained} / {result.total_questions * result.marks_per_question}
                          </td>
                          <td className="border px-4 py-3 text-center">{result.percentage}%</td>
                          <td className="border px-4 py-3 text-center">{result.grade_letter}</td>
                          <td className="border px-4 py-3 text-left">{result.attempted_on}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/teacher/assessment"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            >
              ← Back to Assessment Page
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentQuizHistory;
