import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import AppLayout from '../../components/layout/AppLayout';

const TeacherAssessment = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(localStorage.getItem('user_role'));
  const [userFullName, setUserFullName] = useState(localStorage.getItem('user_full_name') || '');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // ---- helpers ----
  const norm = (s) => (s ?? '').toString().trim();

  // First name sort (A-Z), fallback to full name
  const getFirstName = (fullName) => {
    const cleaned = norm(fullName);
    if (!cleaned) return '';
    return cleaned.split(/\s+/)[0]; // first token
  };

  const sortByFirstName = (a, b) => {
    const aFirst = getFirstName(a.full_name);
    const bFirst = getFirstName(b.full_name);

    const firstCmp = aFirst.localeCompare(bFirst, undefined, {
      sensitivity: 'base',
      numeric: true,
    });

    if (firstCmp !== 0) return firstCmp;

    // fallback: full name compare
    return norm(a.full_name).localeCompare(norm(b.full_name), undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  };

  // Group students by grade and sort each group
  const groupedByGrade = useMemo(() => {
    const groups = {};
    for (const s of students) {
      const g = norm(s.grade) || 'Unknown Grade';
      if (!groups[g]) groups[g] = [];
      groups[g].push(s);
    }

    Object.keys(groups).forEach((g) => {
      groups[g] = [...groups[g]].sort(sortByFirstName);
    });

    // Order grades nicely if they look like "Grade 1, Grade 2..."
    const gradeOrder = Object.keys(groups).sort((a, b) => {
      const numA = parseInt(a.replace(/\D+/g, ''), 10);
      const numB = parseInt(b.replace(/\D+/g, ''), 10);

      const hasNumA = !Number.isNaN(numA);
      const hasNumB = !Number.isNaN(numB);

      if (hasNumA && hasNumB) return numA - numB;
      if (hasNumA) return -1;
      if (hasNumB) return 1;
      return a.localeCompare(b);
    });

    return { groups, gradeOrder };
  }, [students]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axiosInstance.get('teacher/students/', { headers });

        setStudents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    setRole(localStorage.getItem('user_role'));
    setUserFullName(localStorage.getItem('user_full_name') || '');
  }, []);

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
            <h1 className="text-2xl font-extrabold text-green-900 sm:text-3xl">Assessment</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Track your students’ performance</p>
          </div>
        </section>

        <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6 lg:px-8 lg:py-8">
          {loading ? (
            <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-green-700">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-600">No students found.</p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {groupedByGrade.gradeOrder.map((gradeKey) => {
                const list = groupedByGrade.groups[gradeKey] || [];
                return (
                  <section
                    key={gradeKey}
                    className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3 bg-green-100 px-4 py-4 sm:px-5">
                      <h2 className="text-lg font-bold text-green-900 sm:text-xl">{gradeKey}</h2>
                      <span className="rounded-full border border-green-200 bg-white/70 px-3 py-1 text-xs font-semibold text-green-900 sm:text-sm">
                        {list.length} student{list.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-3 p-3 sm:p-4 md:hidden">
                      {list.map((student, idx) => (
                        <article key={`${student.username}-${idx}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="mb-3 border-b border-gray-100 pb-2">
                            <h3 className="break-words text-base font-bold text-gray-900">{student.full_name}</h3>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gray-500">Gender</span>
                              <span className="text-right font-semibold text-gray-800">{student.gender}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gray-500">School</span>
                              <span className="break-words text-right font-semibold text-gray-800">{student.school_name}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gray-500">City</span>
                              <span className="text-right font-semibold text-gray-800">{student.city}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-gray-500">Province</span>
                              <span className="text-right font-semibold text-gray-800">{student.province}</span>
                            </div>
                          </div>

                          <div className="mt-4">
                            <Link
                              to={`/teacher/student/${student.username}/quiz-history`}
                              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                            >
                              View Quiz History
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto bg-white md:block">
                      <table className="min-w-full text-sm">
                        <thead className="bg-white font-semibold text-green-900">
                          <tr>
                            <th className="border-b px-4 py-3 text-left">Full Name</th>
                            <th className="border-b px-4 py-3 text-center">Gender</th>
                            <th className="border-b px-4 py-3 text-center">School</th>
                            <th className="border-b px-4 py-3 text-center">City</th>
                            <th className="border-b px-4 py-3 text-center">Province</th>
                            <th className="border-b px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((student, idx) => (
                            <tr
                              key={`${student.username}-${idx}`}
                              className="transition hover:bg-green-50"
                            >
                              <td className="border-b px-4 py-3 text-left font-medium text-gray-900">
                                {student.full_name}
                              </td>
                              <td className="border-b px-4 py-3 text-center">{student.gender}</td>
                              <td className="border-b px-4 py-3 text-center">{student.school_name}</td>
                              <td className="border-b px-4 py-3 text-center">{student.city}</td>
                              <td className="border-b px-4 py-3 text-center">{student.province}</td>
                              <td className="border-b px-4 py-3 text-center">
                                <Link
                                  to={`/teacher/student/${student.username}/quiz-history`}
                                  className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-white shadow-sm transition hover:bg-green-700"
                                >
                                  View Quiz History
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
};

export default TeacherAssessment;
