import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import logo from '@/assets/logo.png';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

const EditProfile = () => {
  const [grades, setGrades] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    school_name: '',
    schooling_status: '',
    city: '',
    province: '',
    grade: '',
    profile_picture: null,
    username: '',
    role: '',
    language_used_at_home: '',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [role, setRole] = useState(localStorage.getItem('user_role'));
  const [userFullName, setUserFullName] = useState(localStorage.getItem('user_full_name') || '');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await axiosInstance.get('user/me/');
      setFormData((prev) => ({
        ...prev,
        ...res.data,
        profile_picture: null,
      }));
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await axiosInstance.get('grades/');
        const data = res.data;

        // Normalize any backend shape to: [{label, value}]
        const normalized = Array.isArray(data)
          ? data.map((g) => {
              // If API returns strings like ["Grade 1", "Grade 2"]
              if (typeof g === 'string') {
                return { label: g, value: g };
              }

              // If API returns objects like {id, name} or {value, label}
              return {
                label: g.label ?? g.name ?? g.title ?? g.grade_name ?? String(g.value ?? g.id ?? ''),
                value: g.value ?? g.id ?? g.code ?? g.slug ?? g.name ?? g.label ?? '',
              };
            })
          : [];

        setGrades(normalized);
      } catch (error) {
        console.error('Failed to fetch grades:', error);
        setGrades([]);
      }
    };

    fetchGrades();
  }, []);

  useEffect(() => {
    setRole(localStorage.getItem('user_role'));
    setUserFullName(localStorage.getItem('user_full_name') || '');
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) payload.append(key, value);
    });

    try {
      await axiosInstance.put('user/edit-profile/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { old_password, new_password, confirm_password } = passwordData;
    if (new_password !== confirm_password) {
      alert('New passwords do not match.');
      return;
    }
    const token = localStorage.getItem('access_token');
    try {
      await axiosInstance.post('user/change-password/', {
        old_password,
        new_password,
      });
      alert('Password changed successfully.');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to change password.');
    }
  };

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

  const navItems = useMemo(
    () => [
      { key: 'home', label: 'Home', href: '/' },
      { key: 'why-join', label: 'Why Join Learnify?', href: '/why-join' },
      ...(role === 'student'
        ? [
            {
              key: 'assessment',
              label: 'Assessment',
              href: '/student/assessment',
              children: [
                { key: 'subject-wise', label: 'Subject-wise Performance', href: '/student/assessment' },
                { key: 'quiz-history', label: 'Quiz History', href: '/student/quiz-history' },
                { key: 'tasks', label: 'Tasks', href: '/student/tasks' },
              ],
            },
          ]
        : []),
      ...(role === 'teacher'
        ? [
            {
              key: 'assessment',
              label: 'Assessment',
              href: '/teacher/assessment',
              children: [
                { key: 'student-results', label: 'Student Results', href: '/teacher/assessment' },
                { key: 'teacher-tasks', label: 'My Tasks', href: '/teacher/tasks' },
                { key: 'assign-task', label: 'Assign Task', href: '/teacher/assign-task' },
              ],
            },
          ]
        : []),
      { key: 'honor-board', label: 'Honor Board', href: '/honor-board' },
      { key: 'membership', label: 'Membership', href: '/membership' },
      { key: 'help-center', label: 'Help Center', href: '/help-center' },
      ...(!role
        ? [
            {
              key: 'sign-up',
              label: 'Sign up',
              href: '/signup',
              children: [{ key: 'create-account', label: 'Create Account', href: '/signup' }],
            },
          ]
        : []),
    ],
    [role]
  );

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Learning with Responsibility"
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
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            Logout
          </button>
        ) : null
      }
    >
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] text-gray-800">
        <section className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-extrabold text-green-900 sm:text-3xl">Edit Profile</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Update your details and password</p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-1">
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700 sm:h-20 sm:w-20 sm:text-3xl">
                  {formData.full_name?.[0] || formData.username?.[0] || 'U'}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-xl font-bold text-gray-800 sm:text-2xl">
                    {formData.full_name || 'Your Name'}
                  </div>
                  <div className="truncate text-sm text-gray-500">@{formData.username}</div>
                  <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {formData.role || 'User'}
                  </span>
                </div>
              </div>
            </aside>

            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 text-xl font-bold text-green-700">Profile Details</h2>

                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Account Info</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        { label: 'Username', value: formData.username },
                        { label: 'Role', value: formData.role },
                        { label: 'Language Used at Home', value: formData.language_used_at_home },
                      ].map((field, idx) => (
                        <div key={idx} className="md:col-span-1">
                          <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
                          <input
                            type="text"
                            value={field.value}
                            disabled
                            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Editable Details</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        { label: 'Full Name', name: 'full_name', type: 'text' },
                        { label: 'Email', name: 'email', type: 'email' },
                        { label: 'School Name', name: 'school_name', type: 'text' },
                        { label: 'City', name: 'city', type: 'text' },
                      ].map((field, idx) => (
                        <div key={idx} className="md:col-span-1">
                          <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
                          <input
                            type={field.type}
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Academic Selection</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        {
                          label: 'Schooling Status',
                          name: 'schooling_status',
                          options: ['', 'Public school', 'Private school', 'Homeschool', 'Madrassah', 'I am teacher'],
                        },
                        {
                          label: 'Province',
                          name: 'province',
                          options: ['', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir', 'Khyber-Pakhtunkhwa', 'Punjab', 'Sindh', 'Federal Territory'],
                        },
                        {
                          label: 'Grade',
                          name: 'grade',
                          options: grades,
                        },
                      ].map((field, idx) => (
                        <div key={idx} className="md:col-span-1">
                          <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
                          <select
                            name={field.name}
                            value={formData[field.name]}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            {field.options.length > 0 && typeof field.options[0] === 'object' ? (
                              <>
                                <option value="">Select {field.label}</option>
                                {field.options.map((opt, i) => (
                                  <option key={i} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </>
                            ) : (
                              field.options.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt || `Select ${field.label}`}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Update Profile Picture</label>
                    <input
                      type="file"
                      name="profile_picture"
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-green-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-green-700"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-green-600 px-5 py-2.5 text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 sm:w-auto"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <h3 className="text-xl font-bold text-green-700">Change Password</h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      { label: 'Old Password', name: 'old_password' },
                      { label: 'New Password', name: 'new_password' },
                      { label: 'Confirm New Password', name: 'confirm_password' },
                    ].map((field, idx) => (
                      <div key={idx} className="md:col-span-1">
                        <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
                        <input
                          type="password"
                          name={field.name}
                          value={passwordData[field.name]}
                          onChange={handlePasswordChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-green-600 px-5 py-2.5 text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 sm:w-auto"
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EditProfile;
