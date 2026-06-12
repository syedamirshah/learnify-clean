import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import { buildPublicNavItems } from "../../utils/publicNav";
import { useSchoolLogo } from "../../hooks/useSchoolLogo";

export default function SchoolPageShell({ title, subtitle, children }) {
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { logoSrc, logoAlt } = useSchoolLogo();

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
        <section className="border-b border-emerald-200 bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-8 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">School Admin</p>
            <h1 className="mt-1 text-3xl font-black sm:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-emerald-50">{subtitle}</p> : null}
          </div>
        </section>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </AppLayout>
  );
}
