import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";
import TeacherStudentsBrowser from "../../components/teacher/TeacherStudentsBrowser";
import { buildPublicNavItems } from "../../utils/publicNav";

export default function TeacherDashboard() {
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [teacherProfile, setTeacherProfile] = useState({
    full_name: localStorage.getItem("user_full_name") || "",
    school_name: "",
    city: "",
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axiosInstance.get("user/me/");
        setTeacherProfile({
          full_name: res.data?.full_name || userFullName || "",
          school_name: res.data?.school_name || "",
          city: res.data?.city || "",
        });
      } catch (err) {
        console.error("Failed to load teacher profile:", err);
      }
    };
    loadProfile();
  }, [userFullName]);

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

  const welcomeName = teacherProfile.full_name || userFullName || "Teacher";
  const locationLine = [teacherProfile.school_name, teacherProfile.city].filter(Boolean).join(" · ");

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
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] text-gray-800">
        <section className="border-b border-green-200 bg-gradient-to-r from-green-50 via-white to-emerald-50 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-black text-green-900 sm:text-3xl">
              Welcome, {welcomeName}
            </h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              Here is today&apos;s overview for your students.
            </p>
            {locationLine ? (
              <p className="mt-2 text-xs font-semibold text-emerald-800">{locationLine}</p>
            ) : null}
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <TeacherStudentsBrowser searchInputId="dashboard-student-search" />
        </main>
      </div>
    </AppLayout>
  );
}
