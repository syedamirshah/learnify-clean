import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const TeacherAssessment = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 shadow-md border-b border-gray-100">
        <div className="flex items-center gap-6">
          <Link to="/">
            <img
              src={logo}
              alt="Learnify Logo"
              className="h-24 w-auto hover:opacity-80 transition duration-200"
            />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-green-800">Assessment – Your Students</h1>
            <p className="text-gray-500 mt-1">
              Students are grouped by grade and sorted alphabetically by first name.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-green-600 text-lg">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No students found.</p>
        ) : (
          <div className="space-y-8">
            {groupedByGrade.gradeOrder.map((gradeKey) => {
              const list = groupedByGrade.groups[gradeKey] || [];
              return (
                <section
                  key={gradeKey}
                  className="border border-green-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Grade Header */}
                  <div className="bg-green-100 px-5 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-green-900">{gradeKey}</h2>
                    <span className="text-sm text-green-900 bg-white/60 px-3 py-1 rounded-full border border-green-200">
                      {list.length} student{list.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto bg-white">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white text-green-900 font-semibold">
                        <tr>
                          <th className="px-4 py-3 border-b text-left">Full Name</th>
                          <th className="px-4 py-3 border-b">Gender</th>
                          <th className="px-4 py-3 border-b">School</th>
                          <th className="px-4 py-3 border-b">City</th>
                          <th className="px-4 py-3 border-b">Province</th>
                          <th className="px-4 py-3 border-b">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((student, idx) => (
                          <tr
                            key={`${student.username}-${idx}`}
                            className="hover:bg-green-50 transition"
                          >
                            <td className="px-4 py-3 border-b text-left font-medium text-gray-900">
                              {student.full_name}
                            </td>
                            <td className="px-4 py-3 border-b text-center">{student.gender}</td>
                            <td className="px-4 py-3 border-b text-center">{student.school_name}</td>
                            <td className="px-4 py-3 border-b text-center">{student.city}</td>
                            <td className="px-4 py-3 border-b text-center">{student.province}</td>
                            <td className="px-4 py-3 border-b text-center">
                              <Link
                                to={`/teacher/student/${student.username}/quiz-history`}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 text-white shadow-sm hover:bg-green-700 transition"
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
  );
};

export default TeacherAssessment;