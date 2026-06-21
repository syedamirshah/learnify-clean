import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

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

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teachers;
    return teachers.filter((user) =>
      [user.full_name, user.username, user.email].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [search, teachers]);

  const filteredStudents = useMemo(() => {
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
      <UserTable
        title="Students"
        users={filteredStudents}
        emptyMessage="No students found for your school."
        showStudentActions
      />
    </div>
  );
}
