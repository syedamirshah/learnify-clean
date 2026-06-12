import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import AppLayout from "../../components/layout/AppLayout";
import SchoolAnalyticsSections from "../../components/school/SchoolAnalyticsSections";
import SchoolDashboardHeader from "../../components/school/SchoolDashboardHeader";
import SchoolInsightCards from "../../components/school/SchoolInsightCards";
import SchoolOnboardingProgress from "../../components/school/SchoolOnboardingProgress";
import { useSchoolLogo } from "../../hooks/useSchoolLogo";
import { buildPublicNavItems } from "../../utils/publicNav";
import { buildSchoolPaymentChooseUrl } from "../../utils/paymentRedirect";

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm ring-1 ring-emerald-100">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-emerald-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function SchoolDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [taskMonitoring, setTaskMonitoring] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { logoSrc, logoAlt } = useSchoolLogo();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [dashboardRes, analyticsRes, taskRes] = await Promise.all([
          axiosInstance.get("school/dashboard-summary/"),
          axiosInstance.get("school/analytics-summary/"),
          axiosInstance.get("school/task-monitoring/"),
        ]);
        setData(dashboardRes.data || null);
        setAnalytics(analyticsRes.data || null);
        setTaskMonitoring(taskRes.data || null);
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

  const username =
    (typeof window !== "undefined" && localStorage.getItem("username")) || "";
  const schoolPaymentUrl =
    school?.id && username
      ? buildSchoolPaymentChooseUrl(import.meta.env.VITE_API_BASE_URL, school.id, username)
      : "";
  const needsSchoolPayment =
    school.account_status === "pending_payment" ||
    school.account_status === "expired" ||
    !onboarding.subscription_active;

  const formatSeats = (value) =>
    value === null || value === undefined ? "Unlimited" : String(value);

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logoSrc}
      logoAlt={logoAlt}
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
        <SchoolDashboardHeader school={school} loading={loading} error={error} />

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {!loading && !error && data && (
            <>
              <SchoolOnboardingProgress
                onboarding={onboarding}
                counts={counts}
                school={school}
              />

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

              <SchoolInsightCards analytics={analytics} taskMonitoring={taskMonitoring} />

              <SchoolAnalyticsSections data={analytics} mode="dashboard" />

              <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-emerald-950">School Subscription</h2>
                {needsSchoolPayment ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-950">
                      {school.account_status === "expired"
                        ? "Your school subscription has expired."
                        : "Pending Payment — complete payment to activate your school license."}
                    </p>
                    {schoolPaymentUrl ? (
                      <a
                        href={schoolPaymentUrl}
                        className="mt-4 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                      >
                        {school.account_status === "expired" ? "Renew Now" : "Complete Payment"}
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-900">
                      Subscription valid until{" "}
                      <span className="font-bold">{school.subscription_expiry || "—"}</span>
                    </p>
                    {schoolPaymentUrl ? (
                      <a
                        href={schoolPaymentUrl}
                        className="mt-4 inline-flex rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
                      >
                        Renew Subscription
                      </a>
                    ) : null}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-emerald-950">Quick Actions</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <Link
                    to="/school/tasks"
                    className="flex w-full items-center justify-center rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
                  >
                    Task Monitoring
                  </Link>
                  <Link
                    to="/school/settings"
                    className="flex w-full items-center justify-center rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
                  >
                    School Settings
                  </Link>
                  <Link
                    to="/help-center"
                    className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Support
                  </Link>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
