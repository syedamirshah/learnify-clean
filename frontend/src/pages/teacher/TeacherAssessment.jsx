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
  const [searchQuery, setSearchQuery] = useState('');
  const [desktopSortBy, setDesktopSortBy] = useState(null); // 'full_name' | 'city' | 'school_name' | null
  const [desktopSortDirection, setDesktopSortDirection] = useState('asc'); // 'asc' | 'desc'
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

  const query = searchQuery.trim().toLowerCase();

  const filteredGroupedByGrade = useMemo(() => {
    if (!query) return groupedByGrade;

    const groups = {};
    for (const gradeKey of groupedByGrade.gradeOrder) {
      const list = groupedByGrade.groups[gradeKey] || [];
      const filtered = list.filter((student) => {
        const fullName = norm(student.full_name).toLowerCase();
        const school = norm(student.school_name).toLowerCase();
        const city = norm(student.city).toLowerCase();
        const province = norm(student.province).toLowerCase();
        const username = norm(student.username).toLowerCase();
        return (
          fullName.includes(query) ||
          school.includes(query) ||
          city.includes(query) ||
          province.includes(query) ||
          username.includes(query)
        );
      });
      if (filtered.length > 0) groups[gradeKey] = filtered;
    }

    const gradeOrder = groupedByGrade.gradeOrder.filter((g) => groups[g]);
    return { groups, gradeOrder };
  }, [groupedByGrade, query]);

  const totalVisibleStudents = useMemo(
    () =>
      filteredGroupedByGrade.gradeOrder.reduce(
        (sum, gradeKey) => sum + (filteredGroupedByGrade.groups[gradeKey]?.length || 0),
        0
      ),
    [filteredGroupedByGrade]
  );

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

  const handleDesktopSort = (key) => {
    if (desktopSortBy === key) {
      setDesktopSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setDesktopSortBy(key);
    setDesktopSortDirection('asc');
  };

  const getDesktopSortArrow = (key) => {
    if (desktopSortBy !== key) return '';
    return desktopSortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const getSectionListForDesktop = (list) => {
    if (!desktopSortBy) return list;

    const sorted = [...list];
    sorted.sort((a, b) => {
      const aVal = norm(a[desktopSortBy]);
      const bVal = norm(b[desktopSortBy]);
      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base', numeric: true });
      return desktopSortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  };

  const handleJumpToGrade = (gradeKey) => {
    const el = document.getElementById(`grade-${gradeKey.replace(/\s+/g, '-').toLowerCase()}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDesktopSortBy(null);
    setDesktopSortDirection('asc');
  };

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
            <div aria-live="polite" className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-green-700">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div aria-live="polite" className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-600">No students found.</p>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm">
                  <div className="text-xs font-semibold uppercase text-gray-500">Total Students</div>
                  <div className="mt-1 text-xl font-extrabold text-green-900">{totalVisibleStudents}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm">
                  <div className="text-xs font-semibold uppercase text-gray-500">Grades Covered</div>
                  <div className="mt-1 text-xl font-extrabold text-green-900">{filteredGroupedByGrade.gradeOrder.length}</div>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                  <div className="lg:col-span-2">
                    <label htmlFor="student-search" className="mb-1 block text-sm font-medium text-gray-700">
                      Search Students
                    </label>
                    <input
                      id="student-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, username, school, city, province"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="desktop-sort" className="mb-1 block text-sm font-medium text-gray-700">
                      Desktop Sort
                    </label>
                    <select
                      id="desktop-sort"
                      value={desktopSortBy || ''}
                      onChange={(e) => {
                        const value = e.target.value || null;
                        setDesktopSortBy(value);
                        setDesktopSortDirection('asc');
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Default Order</option>
                      <option value="full_name">Name</option>
                      <option value="city">City</option>
                      <option value="school_name">School</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="sort-direction" className="mb-1 block text-sm font-medium text-gray-700">
                      Sort Direction
                    </label>
                    <select
                      id="sort-direction"
                      value={desktopSortDirection}
                      onChange={(e) => setDesktopSortDirection(e.target.value)}
                      disabled={!desktopSortBy}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {filteredGroupedByGrade.gradeOrder.map((gradeKey) => (
                    <button
                      key={gradeKey}
                      type="button"
                      onClick={() => handleJumpToGrade(gradeKey)}
                      className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 transition hover:bg-green-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                    >
                      {gradeKey}
                    </button>
                  ))}
                </div>
              </section>

              {filteredGroupedByGrade.gradeOrder.length === 0 ? (
                <div aria-live="polite" className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                  <p className="text-base font-semibold text-gray-700">No students match your current search/filter.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {filteredGroupedByGrade.gradeOrder.map((gradeKey) => {
                    const list = filteredGroupedByGrade.groups[gradeKey] || [];
                    const desktopList = getSectionListForDesktop(list);
                    const sectionId = `grade-${gradeKey.replace(/\s+/g, '-').toLowerCase()}`;

                    return (
                      <section
                        id={sectionId}
                        key={gradeKey}
                        className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm scroll-mt-24"
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
                                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                                >
                                  <span>View Quiz History</span>
                                  <span aria-hidden="true">→</span>
                                </Link>
                              </div>
                            </article>
                          ))}
                        </div>

                        <div className="hidden overflow-x-auto bg-white md:block">
                          <table className="min-w-full text-sm">
                            <thead className="bg-white font-semibold text-green-900">
                              <tr>
                                <th
                                  scope="col"
                                  className="cursor-pointer border-b px-4 py-3 text-left hover:bg-green-100"
                                  onClick={() => handleDesktopSort('full_name')}
                                  title="Sort by name"
                                >
                                  Full Name{getDesktopSortArrow('full_name')}
                                </th>
                                <th scope="col" className="border-b px-4 py-3 text-center">Gender</th>
                                <th
                                  scope="col"
                                  className="cursor-pointer border-b px-4 py-3 text-center hover:bg-green-100"
                                  onClick={() => handleDesktopSort('school_name')}
                                  title="Sort by school"
                                >
                                  School{getDesktopSortArrow('school_name')}
                                </th>
                                <th
                                  scope="col"
                                  className="cursor-pointer border-b px-4 py-3 text-center hover:bg-green-100"
                                  onClick={() => handleDesktopSort('city')}
                                  title="Sort by city"
                                >
                                  City{getDesktopSortArrow('city')}
                                </th>
                                <th scope="col" className="border-b px-4 py-3 text-center">Province</th>
                                <th scope="col" className="border-b px-4 py-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {desktopList.map((student, idx) => (
                                <tr
                                  key={`${student.username}-${idx}`}
                                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-green-50/35'} transition hover:bg-green-100/50`}
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
                                      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                                    >
                                      <span>View Quiz History</span>
                                      <span aria-hidden="true">→</span>
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
            </>
          )}
        </main>
      </div>
    </AppLayout>
  );
};

export default TeacherAssessment;
