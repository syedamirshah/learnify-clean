import React from "react";

export default function StatCard({ label, value, hint, accent = "green", className = "" }) {
  const labelColor =
    accent === "gold"
      ? "text-amber-700"
      : accent === "blue"
        ? "text-blue-700"
        : "text-[#42b72a]";

  return (
    <div
      className={`rounded-2xl border border-green-100 bg-white p-4 shadow-sm ${className}`}
    >
      <p className={`text-xs font-bold uppercase tracking-wide ${labelColor}`}>{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
