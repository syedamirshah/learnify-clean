import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const TeacherAssessment = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(true);

  // ---- helpers: robust name compare + apply current sort ----
  const norm = (s) => (s ?? '').toString().trim();
  const cmpName = (a, b) =>
    norm(a.full_name).localeCompare(norm(b.full_name), undefined, {
      sensitivity: 'base',   // case-insensitive
      numeric: true,         // natural order if numbers appear
    });

  const applySort = (list, direction) => {
    const data = [...list];
    data.sort((a, b) => (direction === 'asc' ? cmpName(a, b) : cmpName(b, a)));
    return data;
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axiosInstance.get('teacher/students/', { headers });

        // sort once on load for a consistent initial view
        const initial = applySort(res.data, 'asc');
        setStudents(initial);
        setFilteredStudents(initial);

        const uniqueGrades = Array.from(new Set(initial.map((s) => s.grade))).filter(Boolean);
        setGrades(uniqueGrades);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGradeChange = (e) => {
    const grade = e.target.value;
    setSelectedGrade(grade);

    const base = grade === 'All' ? students : students.filter((s) => s.grade === grade);
    // keep current sort after filtering
    setFilteredStudents(applySort(base, sortDirection));
  };

  const handleSortByName = () => {
    const next = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(next);
    setFilteredStudents((prev) => applySort(prev, next));
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header with logo */}
      <header className="flex items-center justify-between px-6 py-4 shadow-md border-b border-gray-100">
        <div className="flex items-center gap-6">
          <Link to="/">
            <img
              src={logo}
              alt="Learnify Logo"
              className="h-24 w-auto hover:opacity-80 transition duration-200"
            />
          </Link>
          <h1 className="text-3xl font-bold text-green-800">Assessment – Your Students</h1>
        </div>
        <div className="text-right">
          <label className="mr-2 font-medium text-gray-700">Filter by Grade:</label>
          <select
            value={selectedGrade}
            onChange={handleGradeChange}
            className="border border-gray-300 rounded px-3 py-1"
          >
            <option value="All">All Grades</option>
            {grades.map((grade, index) => (
              <option key={index} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-green-600 text-lg">Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No students found.</p>
        ) : (
          <div className="overflow-x-auto border border-green-200 rounded-xl shadow-sm">
            <table className="min-w-full bg-white text-sm rounded-xl">
              <thead className="bg-green-100 text-green-900 font-semibold">
                <tr>
                  <th
                    className="px-4 py-3 border cursor-pointer hover:bg-green-200"
                    onClick={handleSortByName}
                  >
                    Full Name {sortDirection === 'asc' ? '▲' : '▼'}
                  </th>
                  <th className="px-4 py-3 border">Email</th>
                  <th className="px-4 py-3 border">Grade</th>
                  <th className="px-4 py-3 border">Gender</th>
                  <th className="px-4 py-3 border">School</th>
                  <th className="px-4 py-3 border">City</th>
                  <th className="px-4 py-3 border">Province</th>
                  <th className="px-4 py-3 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => (
                  <tr key={idx} className="text-center hover:bg-green-50 transition">
                    <td className="border px-3 py-2">{student.full_name}</td>
                    <td className="border px-3 py-2">{student.email}</td>
                    <td className="border px-3 py-2">{student.grade}</td>
                    <td className="border px-3 py-2">{student.gender}</td>
                    <td className="border px-3 py-2">{student.school_name}</td>
                    <td className="border px-3 py-2">{student.city}</td>
                    <td className="border px-3 py-2">{student.province}</td>
                    <td className="border px-3 py-2">
                      <Link
                        to={`/teacher/student/${student.username}/quiz-history`}
                        className="text-green-700 font-medium hover:underline"
                      >
                        View Quiz History
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherAssessment;