import React from "react";

function StatusBadge({ status }) {
  const styles = {
    active: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    pending_payment: "bg-amber-100 text-amber-900 ring-amber-200",
    expired: "bg-red-100 text-red-800 ring-red-200",
    suspended: "bg-gray-200 text-gray-800 ring-gray-300",
  };
  const label = (status || "unknown").replace(/_/g, " ");

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${
        styles[status] || "bg-gray-100 text-gray-700 ring-gray-200"
      }`}
    >
      {label}
    </span>
  );
}

export default function SchoolDashboardHeader({ school, loading, error }) {
  if (loading) {
    return (
      <section className="border-b border-emerald-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-emerald-800">Loading school dashboard...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="border-b border-red-200 bg-red-50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-red-800">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-emerald-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              School Dashboard
            </p>
            <h1 className="truncate text-xl font-black text-emerald-950 sm:text-2xl">
              {school.name || "—"}
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 sm:text-sm">
              {[school.city, school.province].filter(Boolean).join(" · ")}
            </p>
          </div>
          <StatusBadge status={school.account_status} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-gray-700">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200">
            Plan: {school.plan_tier || "—"}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200">
            Billing: {school.billing_cycle || "—"}
          </span>
          {school.subscription_expiry ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200">
              Expires: {school.subscription_expiry}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
