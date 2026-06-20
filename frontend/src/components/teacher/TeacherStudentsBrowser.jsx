import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { pickDefaultGrade, sortGrades } from '../../utils/teacherAssessmentHelpers';

const BRAND_GREEN = '#42b72a';

const getStudentsLoadErrorMessage = (err) => {
  const status = err?.response?.status;
  if (status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  if (status === 403) {
    return 'You do not have permission or active subscription to view students.';
  }
  if (status >= 500) {
    return 'Could not load students due to a server error.';
  }
  return 'Could not load students. Please try again.';
};

const norm = (s) => (s ?? '').toString().trim();

const formatPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${Math.round(num)}%`;
};

const studentAvgChipClass = (value) => {
  const num = Number(value);
  const base =
    'inline-flex min-w-[2.75rem] items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold sm:min-w-[3rem] sm:text-sm';
  if (!Number.isFinite(num)) return `${base} bg-gray-100 text-gray-500`;
  if (num >= 80) return `${base} bg-green-100 text-green-800`;
  if (num >= 50) return `${base} bg-amber-100 text-amber-800`;
  return `${base} bg-red-100 text-red-800`;
};

const vsClassChipClass = (value) => {
  const num = Number(value);
  const base =
    'inline-flex min-w-[2.75rem] items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold sm:min-w-[3rem] sm:text-sm';
  if (!Number.isFinite(num)) return `${base} bg-gray-100 text-gray-500`;
  return `${base} bg-green-50 text-green-800`;
};

const getGradeClassAverage = (gradeStudents) => {
  for (const student of gradeStudents) {
    const num = Number(student.class_average);
    if (Number.isFinite(num)) return num;
  }
  return null;
};

const getFirstName = (fullName) => {
  const cleaned = norm(fullName);
  if (!cleaned) return '';
  return cleaned.split(/\s+/)[0];
};

const sortByFirstName = (a, b) => {
  const aFirst = getFirstName(a.full_name);
  const bFirst = getFirstName(b.full_name);
  const firstCmp = aFirst.localeCompare(bFirst, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  if (firstCmp !== 0) return firstCmp;
  return norm(a.full_name).localeCompare(norm(b.full_name), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
};

export default function TeacherStudentsBrowser({ searchInputId = 'student-search' }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  const groupedByGrade = useMemo(() => {
    const groups = {};
    for (const s of students) {
      const g = norm(s.grade) || 'Unassigned Grade';
      if (!groups[g]) groups[g] = [];
      groups[g].push(s);
    }

    Object.keys(groups).forEach((g) => {
      groups[g] = [...groups[g]].sort(sortByFirstName);
    });

    const gradeOrder = sortGrades(Object.keys(groups));
    return { groups, gradeOrder };
  }, [students]);

  useEffect(() => {
    const { gradeOrder } = groupedByGrade;
    if (gradeOrder.length === 0) {
      setSelectedGrade('');
      return;
    }
    setSelectedGrade((current) => {
      if (current && gradeOrder.includes(current)) return current;
      return pickDefaultGrade(gradeOrder);
    });
  }, [groupedByGrade]);

  const query = searchQuery.trim().toLowerCase();

  const selectedGradeStudents = useMemo(() => {
    const list = groupedByGrade.groups[selectedGrade] || [];
    if (!query) return list;

    return list.filter((student) => {
      const fullName = norm(student.full_name).toLowerCase();
      const username = norm(student.username).toLowerCase();
      return fullName.includes(query) || username.includes(query);
    });
  }, [groupedByGrade, selectedGrade, query]);

  const selectedGradeAllStudents = groupedByGrade.groups[selectedGrade] || [];

  const selectedGradeClassAverage = useMemo(
    () => getGradeClassAverage(selectedGradeAllStudents),
    [selectedGradeAllStudents],
  );

  useEffect(() => {
    const fetchStudents = async () => {
      setLoadError('');
      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axiosInstance.get('teacher/students/', { headers });

        if (!Array.isArray(res.data)) {
          setStudents([]);
          setLoadError('Unexpected response from server.');
          return;
        }

        setStudents(res.data);
      } catch (err) {
        console.error('Failed to load students:', err);
        setStudents([]);
        setLoadError(getStudentsLoadErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const gradeTabClass = (gradeKey) =>
    [
      'rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42b72a] sm:px-6 sm:py-3 sm:text-base',
      selectedGrade === gradeKey
        ? 'border-[#42b72a] bg-[#42b72a] text-white shadow-sm'
        : 'border-[#42b72a] bg-white text-[#42b72a] hover:bg-green-50',
    ].join(' ');

  const sectionHeading =
    selectedGrade && selectedGradeStudents.length > 0
      ? `${selectedGrade} — ${selectedGradeStudents.length} student${selectedGradeStudents.length !== 1 ? 's' : ''}`
      : selectedGrade
        ? `${selectedGrade} Students`
        : '';

  if (loading) {
    return (
      <div
        aria-live="polite"
        className="rounded-xl border border-emerald-200 bg-white p-6 text-center shadow-sm"
      >
        <p className="text-lg font-semibold text-green-700">Loading students...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        aria-live="polite"
        className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm sm:p-8"
      >
        <p className="text-lg font-bold text-amber-950">{loadError}</p>
        {loadError.includes('subscription') && (
          <p className="mt-3 text-sm leading-relaxed text-gray-700">
            Ask an admin to set your account status to active and assign a valid subscription expiry
            date, then reload this page.
          </p>
        )}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div
        aria-live="polite"
        className="rounded-xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-8"
      >
        <p className="text-lg font-bold text-green-900">No students found for your school.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <label htmlFor={searchInputId} className="mb-1.5 block text-sm font-medium text-gray-700">
          Search Students
        </label>
        <input
          id={searchInputId}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or username"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#42b72a] focus:outline-none focus:ring-2 focus:ring-[#42b72a]"
        />
      </div>

      {groupedByGrade.gradeOrder.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Select Grade</p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {groupedByGrade.gradeOrder.map((gradeKey) => (
              <button
                key={gradeKey}
                type="button"
                onClick={() => setSelectedGrade(gradeKey)}
                className={gradeTabClass(gradeKey)}
                aria-pressed={selectedGrade === gradeKey}
              >
                {gradeKey}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedGrade && (
        <section className="overflow-hidden rounded-xl border border-green-100">
          <div className="border-b border-green-100 bg-green-50 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-green-900">{sectionHeading}</h2>
              {selectedGradeAllStudents.length > 0 ? (
                <span className="inline-flex items-center rounded-full border border-green-200 bg-white px-3 py-1 text-sm font-semibold text-green-800 shadow-sm">
                  {selectedGrade} Average: {formatPercent(selectedGradeClassAverage)}
                </span>
              ) : null}
            </div>
          </div>

          {selectedGradeStudents.length === 0 ? (
            <div aria-live="polite" className="p-6 text-center">
              <p className="text-base font-medium text-gray-700">No students found in this grade.</p>
              {query ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#42b72a] bg-white px-4 py-2 text-sm font-semibold text-[#42b72a] transition hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42b72a]"
                >
                  Clear search
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {selectedGradeStudents.map((student, idx) => (
                  <article
                    key={`${student.username}-${idx}`}
                    className="rounded-lg border border-green-100 bg-white p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2 border-b border-gray-100 pb-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">#{idx + 1}</p>
                        <h3 className="break-words text-base font-bold text-gray-900">
                          {student.full_name}
                        </h3>
                      </div>
                    </div>

                    <div className="mb-3 space-y-2 border-b border-gray-100 pb-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Username</span>
                        <span className="text-right font-semibold text-gray-800">
                          {student.username}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Student Avg</span>
                          <span className={studentAvgChipClass(student.student_average)}>
                            {formatPercent(student.student_average)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">vs Class</span>
                          <span className={vsClassChipClass(student.percentile)}>
                            {formatPercent(student.percentile)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link
                        to={`/teacher/student/${student.username}/quiz-history`}
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42b72a]"
                        style={{ backgroundColor: BRAND_GREEN }}
                      >
                        View Quiz History
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-green-50 font-semibold text-green-900">
                    <tr>
                      <th scope="col" className="border-b border-green-100 px-3 py-3 text-center">
                        #
                      </th>
                      <th scope="col" className="border-b border-green-100 px-4 py-3 text-left">
                        Student Name
                      </th>
                      <th scope="col" className="border-b border-green-100 px-4 py-3 text-left">
                        Username
                      </th>
                      <th scope="col" className="border-b border-green-100 px-4 py-3 text-center">
                        Student Avg
                      </th>
                      <th scope="col" className="border-b border-green-100 px-4 py-3 text-center">
                        vs Class
                      </th>
                      <th scope="col" className="border-b border-green-100 px-4 py-3 text-center">
                        Quiz History
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGradeStudents.map((student, idx) => (
                      <tr
                        key={`${student.username}-${idx}`}
                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-green-50/40'} transition hover:bg-green-50`}
                      >
                        <td className="border-b border-green-100 px-3 py-3 text-center text-gray-600">
                          {idx + 1}
                        </td>
                        <td className="border-b border-green-100 px-4 py-3 text-left font-medium text-gray-900">
                          {student.full_name}
                        </td>
                        <td className="border-b border-green-100 px-4 py-3 text-left text-gray-700">
                          {student.username}
                        </td>
                        <td className="border-b border-green-100 px-4 py-3 text-center">
                          <span className={studentAvgChipClass(student.student_average)}>
                            {formatPercent(student.student_average)}
                          </span>
                        </td>
                        <td className="border-b border-green-100 px-4 py-3 text-center">
                          <span className={vsClassChipClass(student.percentile)}>
                            {formatPercent(student.percentile)}
                          </span>
                        </td>
                        <td className="border-b border-green-100 px-4 py-3 text-center">
                          <Link
                            to={`/teacher/student/${student.username}/quiz-history`}
                            className="inline-flex min-h-[40px] items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42b72a]"
                            style={{ backgroundColor: BRAND_GREEN }}
                          >
                            View Quiz History
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
