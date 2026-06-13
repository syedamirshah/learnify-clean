import React from "react";

export default function TrustBadge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-green-100 ${className}`}
    >
      <span className="text-[#42b72a]" aria-hidden="true">
        ✓
      </span>
      {children}
    </span>
  );
}
