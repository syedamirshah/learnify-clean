import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import AppLayout from "../../components/layout/AppLayout";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;
// Backend origin for media files (turns https://api.xxx.com/api/ into https://api.xxx.com/)
const BACKEND_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

// Build safe absolute image URL
const getProfilePicUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BACKEND_ORIGIN}${path}`; // path usually starts with /media/...
};

// Pakistan date format: DD/MM/YYYY
const formatPkDate = (dateStr) => {
  if (!dateStr) return "-";
  // dateStr expected like "2026-01-10"
  const [y, m, d] = String(dateStr).split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
};

const MyProfile = () => {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("user_role"));
  const [userFullName, setUserFullName] = useState(localStorage.getItem("user_full_name") || "");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("profile_picture", file);

    try {
      setUploadingPic(true);

      await axiosInstance.put("user/edit-profile/", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const res = await axiosInstance.get("user/me/");
      setMe(res.data);
    } catch (err) {
      console.error("Profile picture upload failed:", err?.response?.data || err);
      alert("Failed to upload picture. Please try again.");
    } finally {
      setUploadingPic(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await axiosInstance.get("user/me/");
        setMe(res.data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
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

  const navItems = useMemo(
    () => [
      { key: "home", label: "Home", href: "/" },
      { key: "why-join", label: "Why Join Learnify?", href: "/why-join" },
      ...(role === "student"
        ? [
            {
              key: "assessment",
              label: "Assessment",
              href: "/student/assessment",
              children: [
                { key: "subject-wise", label: "Subject-wise Performance", href: "/student/assessment" },
                { key: "quiz-history", label: "Quiz History", href: "/student/quiz-history" },
                { key: "tasks", label: "Tasks", href: "/student/tasks" },
              ],
            },
          ]
        : []),
      ...(role === "teacher"
        ? [
            {
              key: "assessment",
              label: "Assessment",
              href: "/teacher/assessment",
              children: [
                { key: "student-results", label: "Student Results", href: "/teacher/assessment" },
                { key: "teacher-tasks", label: "My Tasks", href: "/teacher/tasks" },
                { key: "assign-task", label: "Assign Task", href: "/teacher/assign-task" },
              ],
            },
          ]
        : []),
      { key: "honor-board", label: "Honor Board", href: "/honor-board" },
      { key: "membership", label: "Membership", href: "/membership" },
      { key: "help-center", label: "Help Center", href: "/help-center" },
      ...(!role
        ? [
            {
              key: "sign-up",
              label: "Sign up",
              href: "/signup",
              children: [{ key: "create-account", label: "Create Account", href: "/signup" }],
            },
          ]
        : []),
    ],
    [role]
  );

  const shellProps = {
    className: "font-[Nunito]",
    logoSrc: logo,
    logoAlt: "Learnify Pakistan Logo",
    brandTitle: "Learnify Pakistan",
    brandMotto: "Learning with Responsibility",
    isAuthenticated: Boolean(role),
    userFullName,
    navItems,
    isMobileDrawerOpen: mobileDrawerOpen,
    onOpenMobileDrawer: () => setMobileDrawerOpen(true),
    onCloseMobileDrawer: () => setMobileDrawerOpen(false),
    onLogoutClick: handleLogout,
    mobileAuthContent: role ? (
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
      >
        Logout
      </button>
    ) : null,
  };

  if (loading) {
    return (
      <AppLayout {...shellProps}>
        <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl justify-center">
            <div className="w-full rounded-2xl border border-green-200 bg-white p-6 text-center shadow-sm">
              <p className="text-base font-semibold text-green-900">Loading profile…</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!me) {
    return (
      <AppLayout {...shellProps}>
        <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <div className="text-lg font-semibold text-red-600">Not logged in.</div>
            <div className="mt-2 text-gray-600">Please sign in to view your profile.</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout {...shellProps}>
      <div className="min-h-[calc(100vh-180px)] bg-[#f6fff6] text-gray-800">
        <section className="border-b border-green-100 bg-gradient-to-b from-green-50 to-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-extrabold text-green-900 sm:text-3xl">My Profile</h1>
            <p className="mt-1 text-sm text-green-800 sm:text-base">View and update your account details.</p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
                  {getProfilePicUrl(me.profile_picture) ? (
                    <img
                      src={getProfilePicUrl(me.profile_picture)}
                      alt="Profile"
                      className="h-full w-full rounded-full border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full border border-gray-200 bg-gray-200 text-xl font-bold text-green-900 sm:text-2xl">
                      {(me.full_name || me.username || "U").trim()[0].toUpperCase()}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => document.getElementById("profilePicInput").click()}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white shadow transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                    title="Change picture"
                  >
                    ✎
                  </button>

                  <input
                    id="profilePicInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePictureChange}
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold text-green-900 sm:text-2xl">
                    {me.full_name || "My Profile"}
                  </h2>
                  <p className="truncate text-sm text-gray-600">@{me.username}</p>
                  {uploadingPic ? (
                    <p className="mt-1 text-xs font-semibold text-green-700">Uploading picture...</p>
                  ) : null}
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
                <Link
                  to="/"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  Home
                </Link>

                <a
                  href={`${API}payments/choose/`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#42b72a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  Make Payment
                </a>

                <Link
                  to="/account/edit-profile"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-green-900">Basic Info</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full Name" value={me.full_name || "-"} />
              <Field label="Username" value={me.username || "-"} />
              <Field label="Role" value={me.role || "-"} />
              <Field label="Email" value={me.email || "-"} />
              <Field label="City" value={me.city || "-"} />
              <Field label="Province" value={me.province || "-"} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-green-900">School / Academic Info</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="School Name" value={me.school_name || "-"} />
              <Field label="Schooling Status" value={me.schooling_status || "-"} />
              <Field label="Grade" value={me.grade_name || "-"} />
              <Field label="Account Status" value={me.account_status || "-"} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-green-900">Subscription Info</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Subscription Plan" value={me.subscription_plan || "-"} />
              <Field
                label="Expiry Date"
                value={me.subscription_expiry ? formatPkDate(me.subscription_expiry) : "-"}
              />
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

const Field = ({ label, value }) => (
  <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
    <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
    <div className="mt-1 break-words text-base font-semibold text-gray-800">{String(value)}</div>
  </div>
);

export default MyProfile;
