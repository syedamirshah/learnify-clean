import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import AppLayout from "../../components/layout/AppLayout";
import SchoolDashboardHeader from "../../components/school/SchoolDashboardHeader";
import SchoolOnboardingProgress from "../../components/school/SchoolOnboardingProgress";
import SchoolUsersContent from "../../components/school/SchoolUsersContent";
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
        const dashboardRes = await axiosInstance.get("school/dashboard-summary/");
        setData(dashboardRes.data || null);
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
  const showSubscriptionAlert =
    school.account_status === "pending_payment" ||
    school.account_status === "expired" ||
    school.account_status === "suspended";

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
            className="rounded-md bg-[#42b72a] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700"
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

              <SchoolUsersContent
                showCards={false}
                sectionTitle="Students and Teachers"
                searchInputId="dashboard-school-user-search"
              />

              {showSubscriptionAlert ? (
                <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-black text-emerald-950">School Subscription</h2>
                  {school.account_status === "suspended" ? (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-800">
                        Your school account has been suspended. Please contact Learnify support for
                        assistance.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-950">
                        {school.account_status === "expired"
                          ? "Your school subscription has expired."
                          : "Pending Payment — complete payment to activate your school license."}
                      </p>
                      {schoolPaymentUrl ? (
                        <a
                          href={schoolPaymentUrl}
                          className="mt-4 inline-flex rounded-2xl bg-[#42b72a] px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                        >
                          {school.account_status === "expired" ? "Renew Now" : "Complete Payment"}
                        </a>
                      ) : null}
                    </div>
                  )}
                </section>
              ) : null}
            </>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
