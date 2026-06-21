import React, { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";

export default function SchoolTeacherSummary() {
  const { username } = useParams();
  const [teacherId, setTeacherId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const res = await axiosInstance.get(`school/teacher/${username}/summary/`);
        setTeacherId(res.data?.teacher?.id ?? null);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load teacher."
        );
      }
    };
    load();
  }, [username]);

  if (teacherId) {
    return <Navigate to={`/school/teachers/${teacherId}`} replace />;
  }

  return (
    <SchoolPageShell title="Teacher" subtitle="Redirecting to teacher monitoring...">
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : (
        <p className="text-emerald-800">Loading teacher...</p>
      )}
    </SchoolPageShell>
  );
}
