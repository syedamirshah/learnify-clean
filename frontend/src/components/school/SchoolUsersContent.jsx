import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { sortGrades } from "../../utils/teacherAssessmentHelpers";

const ALL_GRADES = "All";

const norm = (value) => (value ?? "").toString().trim();

const formatPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${Math.round(num)}%`;
};

const studentAvgChipClass = (value) => {
  const num = Number(value);
  const base =
    "inline-flex min-w-[2.75rem] items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  if (!Number.isFinite(num)) return `${base} bg-gray-100 text-gray-500`;
  if (num >= 80) return `${base} bg-green-100 text-green-800`;
  if (num >= 50) return `${base} bg-amber-100 text-amber-800`;
  return `${base} bg-red-100 text-red-800`;
};

function gradeTabClass(selected, gradeKey) {
  return [
    "rounded-full border-2 px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42b72a] sm:px-5 sm:py-2.5",
    selected === gradeKey
      ? "border-[#42b72a] bg-[#42b72a] text-white shadow-sm"
      : "border-[#42b72a] bg-white text-[#42b72a] hover:bg-green-50",
  ].join(" ");
}

function UserTable({ title, users, emptyMessage, showStudentActions = false }) {
  return (
    <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-emerald-950">{title}</h3>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
          {users.length}
        </span>
      </div>
      {users.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-100 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Username</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Grade</th>
                <th className="px-2 py-2">Status</th>
                {showStudentActions ? <th className="px-2 py-2 text-center">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="px-2 py-3 font-semibold text-emerald-950">{user.full_name || "—"}</td>
                  <td className="px-2 py-3">{user.username}</td>
                  <td className="px-2 py-3">{user.email || "—"}</td>
                  <td className="px-2 py-3">{user.grade || "—"}</td>
                  <td className="px-2 py-3 capitalize">{user.account_status || "—"}</td>
                  {showStudentActions ? (
                    <td className="px-2 py-3 text-center">
                      <Link
                        to={`/school/student/${user.username}`}
                        className="inline-flex rounded-xl bg-[#42b72a] px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                      >
                        View Summary
                      </Link>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StudentsTable({
  students,
  searchFilteredStudents,
  selectedGrade,
  onSelectGrade,
  gradeOptions,
}) {
  const displayStudents = useMemo(() => {
    if (selectedGrade === ALL_GRADES) return searchFilteredStudents;
    return searchFilteredStudents.filter((user) => {
      const grade = norm(user.grade) || "Unassigned Grade";
      return grade === selectedGrade;
    });
  }, [searchFilteredStudents, selectedGrade]);

  const emptyMessage = useMemo(() => {
    if (students.length === 0) return "No students found for your school.";
    if (displayStudents.length === 0 && selectedGrade !== ALL_GRADES) {
      return "No students found for this grade.";
    }
    return "No students found for your school.";
  }, [students.length, displayStudents.length, selectedGrade]);

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-emerald-950">Students</h3>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
          {displayStudents.length}
        </span>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-gray-500">No students found for your school.</p>
      ) : (
        <>
          {gradeOptions.length > 0 ? (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Filter by Grade</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSelectGrade(ALL_GRADES)}
                  className={gradeTabClass(selectedGrade, ALL_GRADES)}
                  aria-pressed={selectedGrade === ALL_GRADES}
                >
                  All
                </button>
                {gradeOptions.map((gradeKey) => (
                  <button
                    key={gradeKey}
                    type="button"
                    onClick={() => onSelectGrade(gradeKey)}
                    className={gradeTabClass(selectedGrade, gradeKey)}
                    aria-pressed={selectedGrade === gradeKey}
                  >
                    {gradeKey}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {displayStudents.length === 0 ? (
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-100 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Username</th>
                    <th className="px-2 py-2">Email</th>
                    <th className="px-2 py-2">Grade</th>
                    <th className="px-2 py-2">Student Avg</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStudents.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="px-2 py-3 font-semibold text-emerald-950">
                        {user.full_name || "—"}
                      </td>
                      <td className="px-2 py-3">{user.username}</td>
                      <td className="px-2 py-3">{user.email || "—"}</td>
                      <td className="px-2 py-3">{user.grade || "—"}</td>
                      <td className="px-2 py-3">
                        <span className={studentAvgChipClass(user.student_average)}>
                          {formatPercent(user.student_average)}
                        </span>
                      </td>
                      <td className="px-2 py-3 capitalize">{user.account_status || "—"}</td>
                      <td className="px-2 py-3 text-center">
                        <Link
                          to={`/school/student/${user.username}`}
                          className="inline-flex rounded-xl bg-[#42b72a] px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                        >
                          View Summary
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function SchoolUsersContent({
  showCards = true,
  sectionTitle = "",
  searchInputId = "school-user-search",
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudentGrade, setSelectedStudentGrade] = useState(ALL_GRADES);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("school/users/");
        setTeachers(res.data?.teachers || []);
        setStudents(res.data?.students || []);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load school users."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const studentGradeOptions = useMemo(() => {
    const grades = new Set();
    for (const student of students) {
      grades.add(norm(student.grade) || "Unassigned Grade");
    }
    return sortGrades([...grades]);
  }, [students]);

  useEffect(() => {
    if (studentGradeOptions.length === 0) {
      setSelectedStudentGrade(ALL_GRADES);
      return;
    }
    setSelectedStudentGrade((current) => {
      if (current === ALL_GRADES) return ALL_GRADES;
      if (studentGradeOptions.includes(current)) return current;
      return ALL_GRADES;
    });
  }, [studentGradeOptions]);

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teachers;
    return teachers.filter((user) =>
      [user.full_name, user.username, user.email].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [search, teachers]);

  const searchFilteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((user) =>
      [user.full_name, user.username, user.email].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [search, students]);

  if (loading) {
    return <p className="text-emerald-800">Loading users...</p>;
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
    );
  }

  return (
    <div className="space-y-6">
      {sectionTitle ? (
        <div>
          <h2 className="text-xl font-black text-emerald-950 sm:text-2xl">{sectionTitle}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Teachers and students linked to your school.
          </p>
        </div>
      ) : null}

      {showCards ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Teachers</p>
            <p className="mt-1 text-2xl font-black text-emerald-950">{teachers.length}</p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Students</p>
            <p className="mt-1 text-2xl font-black text-emerald-950">{students.length}</p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Total Users</p>
            <p className="mt-1 text-2xl font-black text-emerald-950">
              {teachers.length + students.length}
            </p>
          </div>
        </section>
      ) : null}

      <div>
        <label htmlFor={searchInputId} className="text-sm font-semibold text-emerald-950">
          Search
        </label>
        <input
          id={searchInputId}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, username, or email"
          className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <UserTable
        title="Teachers"
        users={filteredTeachers}
        emptyMessage="No teachers found for your school."
      />

      <StudentsTable
        students={students}
        searchFilteredStudents={searchFilteredStudents}
        selectedGrade={selectedStudentGrade}
        onSelectGrade={setSelectedStudentGrade}
        gradeOptions={studentGradeOptions}
      />
    </div>
  );
}
