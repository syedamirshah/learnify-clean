import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Link } from "react-router-dom";

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
        <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative w-20 h-20">
            {getProfilePicUrl(me.profile_picture) ? (
                <img
                src={getProfilePicUrl(me.profile_picture)}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border"
                />
            ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-green-900 font-bold text-2xl border">
                {(me.full_name || me.username || "U").trim()[0].toUpperCase()}
                </div>
            )}

            {/* Small edit button on avatar */}
            <button
                type="button"
                onClick={() => document.getElementById("profilePicInput").click()}
                className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-green-700"
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

            <div>
            <h1 className="text-3xl font-semibold text-green-900"> 
                {me.full_name || "My Profile"}
            </h1>
            <div className="text-gray-600 text-sm">@{me.username}</div>
            </div>
        </div>

        <div className="flex gap-3">
            <Link
                to="/"
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
                Home
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
            <Field label="Grade" value={me.grade_name || "-"} />
            <Field label="Account Status" value={me.account_status || "-"} />
            <Field label="Subscription Plan" value={me.subscription_plan || "-"} />
            <Field label="Expiry Date" value={me.subscription_expiry ? formatPkDate(me.subscription_expiry) : "-"} />

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