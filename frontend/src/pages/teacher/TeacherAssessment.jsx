import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import AppLayout from '../../components/layout/AppLayout';
import TeacherStudentsBrowser from '../../components/teacher/TeacherStudentsBrowser';
import { buildPublicNavItems } from '../../utils/publicNav';

const BRAND_GREEN = '#42b72a';

const TeacherAssessment = () => {
  const [role, setRole] = useState(localStorage.getItem('user_role'));
  const [userFullName, setUserFullName] = useState(localStorage.getItem('user_full_name') || '');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setRole(localStorage.getItem('user_role'));
    setUserFullName(localStorage.getItem('user_full_name') || '');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_full_name');
    localStorage.removeItem('account_status');
    localStorage.removeItem('role');
    localStorage.removeItem('user_grade');
    navigate('/', { replace: true });
  };

  const navItems = useMemo(() => buildPublicNavItems(role), [role]);

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
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42b72a]"
            style={{ backgroundColor: BRAND_GREEN }}
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] text-gray-800">
        <section className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-extrabold text-green-900 sm:text-3xl">My Students</h1>
            <p className="mt-1 text-sm text-gray-600">
              Browse students by grade and open their quiz history.
            </p>
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <TeacherStudentsBrowser searchInputId="assessment-student-search" />
        </main>
      </div>
    </AppLayout>
  );
};

export default TeacherAssessment;
