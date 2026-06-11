import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import SchoolAnalyticsSections from "../../components/school/SchoolAnalyticsSections";
import { buildPublicNavItems } from "../../utils/publicNav";

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm ring-1 ring-emerald-100">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-emerald-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

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
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${
        styles[status] || "bg-gray-100 text-gray-700 ring-gray-200"
      }`}
    >
      {label}
    </span>
  );
}

function ChecklistItem({ done, label }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        {done ? "✓" : "□"}
      </span>
      <span className={done ? "font-semibold text-emerald-950" : "text-gray-600"}>{label}</span>
    </li>
  );
}

export default function SchoolDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [dashboardRes, analyticsRes] = await Promise.all([
          axiosInstance.get("school/dashboard-summary/"),
          axiosInstance.get("school/analytics-summary/"),
        ]);
        setData(dashboardRes.data || null);
        setAnalytics(analyticsRes.data || null);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "Failed to load school dashboard."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
    setUserFullName(localStorage.getItem("user_full_name") || "");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_full_name");
    localStorage.removeItem("account_status");
    localStorage.removeItem("role");
    localStorage.removeItem("user_grade");
    navigate("/", { replace: true });
  };

  const navItems = useMemo(() => buildPublicNavItems(role), [role]);

  const school = data?.school || {};
  const counts = data?.counts || {};
  const capacity = data?.capacity || {};
  const onboarding = data?.onboarding || {};

  const formatSeats = (value) =>
    value === null || value === undefined ? "Unlimited" : String(value);

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Practicing Math Responsibly"
      isAuthenticated={Boolean(role)}
      userFullName={userFullName}
      navItems={navItems}
      isMobileDrawerOpen={mobileDrawerOpen}
      onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
      onLogoutClick={handleLogout}
      mobileAuthContent={
        role ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-gradient-to-b from-emerald-50 via-white to-white text-gray-800">
        <section className="border-b border-emerald-200 bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-8 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {loading ? (
              <p className="text-lg font-semibold">Loading school dashboard...</p>
            ) : error ? (
              <p className="text-lg font-semibold">{error}</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
                      School Dashboard
                    </p>
                    <h1 className="mt-1 text-3xl font-black sm:text-4xl">{school.name}</h1>
                    <p className="mt-2 text-sm text-emerald-50">
                      {[school.city, school.province].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <StatusBadge status={school.account_status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/25">
                    Plan: {school.plan_tier || "—"}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/25">
                    Billing: {school.billing_cycle || "—"}
                  </span>
                  {school.subscription_expiry ? (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/25">
                      Expires: {school.subscription_expiry}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          {!loading && !error && data && (
            <>
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard label="Students" value={counts.students ?? 0} />
                <MetricCard label="Teachers" value={counts.teachers ?? 0} />
                <MetricCard
                  label="Seats Used"
                  value={capacity.used_students ?? 0}
                  hint={`of ${formatSeats(capacity.max_students)}`}
                />
                <MetricCard
                  label="Seats Remaining"
                  value={formatSeats(capacity.remaining_students)}
                />
              </section>

              <SchoolAnalyticsSections data={analytics} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-black text-emerald-950">Onboarding Checklist</h2>
                  <ul className="mt-4 space-y-3">
                    <ChecklistItem done={onboarding.school_created} label="School Created" />
                    <ChecklistItem done={onboarding.subscription_active} label="Subscription Active" />
                    <ChecklistItem done={onboarding.roster_uploaded} label="Upload Roster" />
                    <ChecklistItem done={onboarding.ready} label="Ready For Learning" />
                  </ul>
                </section>

                <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-black text-emerald-950">Quick Actions</h2>
                  <div className="mt-4 space-y-3">
                    <Link
                      to="/school/upload"
                      className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      Upload Roster
                    </Link>
                    <Link
                      to="/school/users"
                      className="flex w-full items-center justify-center rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
                    >
                      View Users
                    </Link>
                    <button
                      type="button"
                      disabled
                      className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-500"
                    >
                      Manage School
                      <span className="text-xs font-bold uppercase text-amber-700">Coming Soon</span>
                    </button>
                    <Link
                      to="/help-center"
                      className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      Support
                    </Link>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
