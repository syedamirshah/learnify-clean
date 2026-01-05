import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Link } from "react-router-dom";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;

const MyProfile = () => {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-6">Loading profile…</div>;

  if (!me) {
    return (
      <div className="p-6">
        <div className="text-lg font-semibold text-red-600">Not logged in.</div>
        <div className="text-gray-600 mt-2">Please sign in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 px-4 md:px-10 py-8">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-extrabold text-green-900">My Profile</h1>

          <div className="flex gap-3">
            <Link
                to="/"
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                ← Home
            </Link>

            <a
              href={`${API}payments/choose/`}
              className="bg-[#42b72a] text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Make Payment
            </a>

            <Link
              to="/account/edit-profile"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="rounded-xl border shadow-sm p-6 bg-gray-50">
          
        <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border bg-white flex items-center justify-center">
                {me.profile_picture_url ? (
                <img
                    src={me.profile_picture_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                />
                ) : (
                <span className="text-2xl font-bold text-green-800">
                    {(me.full_name || me.username || "U").slice(0, 1).toUpperCase()}
                </span>
                )}
            </div>

            <div>
                <div className="text-lg font-bold text-gray-900">{me.full_name || "-"}</div>
                <div className="text-sm text-gray-600">@{me.username || "-"}</div>
            </div>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Field label="Full Name" value={me.full_name || "-"} />
            <Field label="Username" value={me.username || "-"} />
            <Field label="Role" value={me.role || "-"} />
            <Field label="Email" value={me.email || "-"} />
            <Field label="City" value={me.city || "-"} />
            <Field label="Province" value={me.province || "-"} />
            <Field label="School Name" value={me.school_name || "-"} />
            <Field label="Schooling Status" value={me.schooling_status || "-"} />
            <Field label="Grade" value={me.grade || "-"} />
            <Field label="Account Status" value={me.account_status || "-"} />
            <Field label="Subscription Plan" value={me.subscription_plan || "-"} />
            <Field label="Expiry Date" value={me.subscription_expiry || me.subscription_expiry_date || me.expiry_date || "-"} />

          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value }) => (
  <div className="bg-white rounded-lg border p-4">
    <div className="text-xs font-semibold text-gray-500 uppercase">{label}</div>
    <div className="text-base font-semibold text-gray-800 mt-1">{String(value)}</div>
  </div>
);

export default MyProfile;