import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import AppLayout from '../../components/layout/AppLayout';

const SignupPage = () => {
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [grades, setGrades] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(localStorage.getItem('user_role'));
  const [userFullName, setUserFullName] = useState(localStorage.getItem('user_full_name') || '');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    axiosInstance.get('grades/')
      .then((response) => setGrades(response.data))
      .catch((error) => console.error("Failed to fetch grades:", error));
  }, []);

  useEffect(() => {
    setCurrentUserRole(localStorage.getItem('user_role'));
    setUserFullName(localStorage.getItem('user_full_name') || '');
  }, []);

  // Single form for both roles. We’ll conditionally render/append `grade`.
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    gender: '',
    language_used_at_home: '',
    schooling_status: '',
    school_name: '',
    grade: '',            // will be used only for students
    city: '',
    province: '',
    profile_picture: null // fee_receipt/subscription_plan removed
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_full_name");
    localStorage.removeItem("account_status");
    localStorage.removeItem("role");
    localStorage.removeItem("user_grade");
    setCurrentUserRole(null);
    setUserFullName("");
    navigate("/", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side rule: grade required for student, ignored for teacher
    if (role === 'student' && !formData.grade) {
      alert('Please select your Grade.');
      return;
    }

    const form = new FormData();
    form.append('role', role);

    for (const key in formData) {
      const val = formData[key];
      if (val === null || val === undefined) continue;

      if (key === 'grade') {
        // Only send grade for students
        if (role === 'student') {
          form.append('grade', typeof formData.grade === 'object' ? formData.grade.id : formData.grade);
        }
      } else {
        form.append(key, val);
      }
    }

    try {
      await axiosInstance.post('register/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Immediately guide them to payment
      alert('✅ Account created!\n\nNext step: please complete your fee payment.');
      window.location.href =
        `${import.meta.env.VITE_API_BASE_URL}payments/choose/?username=${encodeURIComponent(formData.username)}`;
      } catch (error) {
        console.error("❌ Registration failed:", error);
  
        const resp = error.response;
  
        // Special case: account not active
        if (resp?.status === 403) {
          alert('Your account is not active yet. Please wait for activation.');
          return;
        }
  
        // If backend sent structured errors, turn them into friendly lines
        if (resp?.data) {
          const data = resp.data;
          let messageLines = [];
  
          // Case 1: our usual {"success": false, "errors": { ... }}
          if (data.errors && typeof data.errors === 'object') {
            const errorsObj = data.errors;
  
            // If username error exists, show a very clear line
            if (errorsObj.username) {
              const usernameMsg = Array.isArray(errorsObj.username)
                ? errorsObj.username.join(' ')
                : String(errorsObj.username);
              messageLines.push(`User ID: ${usernameMsg}`);
            }
  
            // Handle all other fields
            Object.entries(errorsObj).forEach(([field, msgs]) => {
              if (field === 'username') return; // already handled
              const niceFieldName =
                field === 'full_name' ? 'Full name'
                : field === 'schooling_status' ? 'Schooling status'
                : field === 'language_used_at_home' ? 'Language used at home'
                : field === 'profile_picture' ? 'Profile picture'
                : field === 'grade' ? 'Grade'
                : field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
  
              const text = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
              messageLines.push(`${niceFieldName}: ${text}`);
            });
          }
  
          // Case 2: DRF sometimes sends a top-level "detail" message
          if (data.detail && typeof data.detail === 'string') {
            messageLines.push(data.detail);
          }
  
          // Fallback: if we still have nothing, show generic
          if (messageLines.length === 0) {
            messageLines.push('Please check the form and try again.');
          }
  
          alert('Registration could not be completed:\n\n' + messageLines.join('\n'));
          return;
        }
  
        // Network / unknown errors
        alert('Registration failed. Please check your internet connection and try again.');
      }
  };

  // Teacher has a single “I am Teacher” schooling option; students see school types
  const schoolingOptions =
    role === 'teacher'
      ? [{ label: 'I am Teacher', value: 'I am teacher' }]
      : [
          { label: 'Public School', value: 'Public school' },
          { label: 'Private School', value: 'Private school' },
          { label: 'Homeschool', value: 'Homeschool' },
          { label: 'Madrassah', value: 'Madrassah' }
        ];

  const navItems = [
    { key: "home", label: "Home", href: "/" },
    { key: "why-join", label: "Why Join Learnify?", href: "/why-join" },
    { key: "honor-board", label: "Honor Board", href: "/honor-board" },
    { key: "membership", label: "Membership", href: "/membership" },
    { key: "help-center", label: "Help Center", href: "/help-center" },
    ...(!currentUserRole
      ? [
          {
            key: "sign-up",
            label: "Sign up",
            href: "/signup",
            children: [{ key: "create-account", label: "Create Account", href: "/signup" }],
          },
        ]
      : []),
  ];

  return (
    <AppLayout
      className="font-[Nunito]"
      logoSrc={logo}
      logoAlt="Learnify Pakistan Logo"
      brandTitle="Learnify Pakistan"
      brandMotto="Learning with Responsibility"
      isAuthenticated={Boolean(currentUserRole)}
      userFullName={userFullName}
      navItems={navItems}
      isMobileDrawerOpen={mobileDrawerOpen}
      onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
      onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
      onLogoutClick={handleLogout}
      mobileAuthContent={
        currentUserRole ? (
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
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6]">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10 py-8 md:py-10">
        <div className="mb-6 rounded-2xl border border-green-200 bg-white/80 p-5 shadow-sm md:p-6">
          <h1 className="text-3xl font-extrabold text-green-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-700 md:text-base">
            Join Learnify Pakistan to access curriculum-aligned quizzes and progress tracking.
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-white/80 p-5 shadow-sm md:p-6">

        <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-6">
          <button
            onClick={() => setRole('student')}
            className={`w-full sm:w-auto rounded-xl px-6 py-2.5 font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${
              role === 'student' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            I'm a Student
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`w-full sm:w-auto rounded-xl px-6 py-2.5 font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${
              role === 'teacher' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            I'm a Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="min-w-0">
            <h2 className="mb-4 border-b border-green-100 pb-2 text-lg font-bold text-green-900">Account Info</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input name="username" value={formData.username} onChange={handleChange}
              className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm" />
              </div>

              <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm"
            />
            <label className="mt-1 inline-flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword((prev) => !prev)}
                className="mr-2"
              />
              Show Password
            </label>
              </div>

              <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Full Name</label>
            <input name="full_name" value={formData.full_name} onChange={handleChange}
              className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm" />
              </div>

              <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Email</label>
            <input name="email" value={formData.email} onChange={handleChange}
              className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm" />
              </div>

              <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}
              className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
              </div>

              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Role</label>
                <input
                  value={role === "student" ? "Student" : "Teacher"}
                  readOnly
                  className="w-full min-w-0 border border-gray-300 bg-gray-50 px-3 py-2.5 rounded-xl text-sm text-gray-700"
                />
              </div>
            </div>
          </section>

          <section className="min-w-0">
            <h2 className="mb-4 border-b border-green-100 pb-2 text-lg font-bold text-green-900">Profile & Context</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">Language Used at Home</label>
                <select name="language_used_at_home" value={formData.language_used_at_home} onChange={handleChange}
                  className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm">
                  <option value="">Select Language</option>
                  <option value="Balochi">Balochi</option>
                  <option value="Brahui">Brahui</option>
                  <option value="Chitrali">Chitrali</option>
                  <option value="Hindko">Hindko</option>
                  <option value="Dari/Farsi">Dari/Farsi</option>
                  <option value="Other">Other</option>
                  <option value="Pashto">Pashto</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Saraiki">Saraiki</option>
                  <option value="Sindhi">Sindhi</option>
                  <option value="Urdu">Urdu</option>
                </select>
              </div>

              <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Schooling Status</label>
            <select name="schooling_status" value={formData.schooling_status} onChange={handleChange}
              className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm">
              <option value="">Select Status</option>
              {schoolingOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
              </div>

              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">School Name</label>
                <input name="school_name" value={formData.school_name} onChange={handleChange}
                  className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm" />
              </div>

              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">City</label>
                <input name="city" value={formData.city} onChange={handleChange}
                  className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm" />
              </div>

            {/* Grade — only for students */}
            {role === 'student' && (
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Grade</label>
                <select
                  name="grade"
                  value={formData.grade && typeof formData.grade === 'object' ? formData.grade.id : formData.grade}
                  onChange={(e) => {
                    const selectedId = parseInt(e.target.value, 10);
                    const selectedGrade =
                      Number.isFinite(selectedId) ? grades.find((g) => g.id === selectedId) : '';
                    setFormData((prev) => ({
                      ...prev,
                      grade: selectedGrade || e.target.value, // keep id string if not mapped
                    }));
                  }}
                  className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm"
                >
                  <option value="">Select Grade</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

              <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Province / Region</label>
            <select name="province" value={formData.province} onChange={handleChange}
                className="w-full min-w-0 border border-gray-300 px-3 py-2.5 rounded-xl text-sm">
                <option value="">Select Province</option>
                <option value="Azad Kashmir">Azad Kashmir</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Federal Territory">Federal Territory</option>
                <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                <option value="Khyber-Pakhtunkhwa">Khyber-Pakhtunkhwa</option>
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
            </select>
              </div>
            </div>
          </section>

          <section className="min-w-0">
            <h2 className="mb-4 border-b border-green-100 pb-2 text-lg font-bold text-green-900">Subscription & Uploads</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Profile Picture</label>
                <input type="file" name="profile_picture" onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm" />
                <p className="mt-1 text-xs text-gray-500 break-words">
                  Optional. You can also update your profile picture later.
                </p>
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div aria-live="polite" className="mt-6 text-center">
            <button type="submit"
              className="w-full md:w-auto md:min-w-[280px] mx-auto bg-green-700 text-white py-3 px-6 rounded-xl hover:bg-green-800 transition-all duration-300 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300">
              Create Account
            </button>
            <div className="mt-3">
              <Link
                to="/login"
                className="text-sm text-green-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 rounded"
              >
                Already have an account? Login
              </Link>
            </div>
          </div>
        </form>
        </div>
      </div>
      </div>
    </AppLayout>
  );
};

export default SignupPage;
