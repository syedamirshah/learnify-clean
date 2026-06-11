import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import SchoolPageShell from "../../components/school/SchoolPageShell";
import SchoolAnalyticsSections from "../../components/school/SchoolAnalyticsSections";

export default function SchoolAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("school/analytics-summary/");
        setData(res.data || null);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load school analytics."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <SchoolPageShell
      title="School Analytics"
      subtitle="Monitor school-wide performance, grade trends, and students who need support."
    >
      {loading ? (
        <p className="text-emerald-800">Loading analytics...</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : (
        <SchoolAnalyticsSections data={data} />
      )}
    </SchoolPageShell>
  );
}
