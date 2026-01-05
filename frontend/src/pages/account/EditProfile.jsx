import React, { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import logo from '@/assets/logo.png';
import { Link } from 'react-router-dom';

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

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await axiosInstance.get("user/me/");
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
        const res = await axiosInstance.get("grades/");
        const data = res.data;

        // Normalize any backend shape to: [{label, value}]
        const normalized = Array.isArray(data)
          ? data.map((g) => {
              // If API returns strings like ["Grade 1", "Grade 2"]
              if (typeof g === "string") {
                return { label: g, value: g };
              }

              // If API returns objects like {id, name} or {value, label}
              return {
                label: g.label ?? g.name ?? g.title ?? g.grade_name ?? String(g.value ?? g.id ?? ""),
                value: g.value ?? g.id ?? g.code ?? g.slug ?? g.name ?? g.label ?? "",
              };
            })
          : [];

        setGrades(normalized);
      } catch (error) {
        console.error("Failed to fetch grades:", error);
        setGrades([]);
      }
    };

    fetchGrades();
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

  return (
    <>
      {/* Monogram Navigation */}
      <nav className="w-full flex justify-start bg-white px-6 py-4 shadow-sm">
        <div className="inline-block">
          <Link to="/">
            <img
              src={logo}
              alt="Learnify Home"
              className="h-28 w-auto hover:opacity-80 transition duration-200"
              style={{ background: "transparent" }}
            />
          </Link>
        </div>
      </nav>

      {/* White outer container to eliminate gray */}
      <div className="bg-white py-10">
        {/* Center wrapper so header + card align */}
        <div className="max-w-2xl mx-auto px-6">
          {/* Profile Header */}
          <div className="flex items-center gap-6 mb-6 bg-white p-6 rounded-xl shadow">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl font-bold text-green-700">
              {formData.full_name?.[0] || formData.username?.[0] || "U"}
            </div>

            <div>
              <div className="text-2xl font-bold text-gray-800">
                {formData.full_name || "Your Name"}
              </div>
              <div className="text-gray-500">@{formData.username}</div>
              <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-semibold">
                {formData.role}
              </span>
            </div>
          </div>

          {/* Green inner card */}
          <div className="px-6 py-8 bg-green-50 border border-green-300 rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-green-700 mb-6">Edit Profile</h2>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Read-only Fields */}
              {([
                { label: 'Username', value: formData.username },
                { label: 'Role', value: formData.role },
                { label: 'Language Used at Home', value: formData.language_used_at_home }
              ]).map((field, idx) => (
                <div key={idx} className="bg-white p-4 rounded shadow-sm">
                  <label className="block text-gray-700 font-semibold mb-1">{field.label}</label>
                  <input type="text" value={field.value} disabled className="w-full p-2 border rounded bg-gray-100" />
                </div>
              ))}

              {/* Editable Fields */}
              {[
                { label: 'Full Name', name: 'full_name', type: 'text' },
                { label: 'Email', name: 'email', type: 'email' },
                { label: 'School Name', name: 'school_name', type: 'text' },
                { label: 'City', name: 'city', type: 'text' },
              ].map((field, idx) => (
                <div key={idx} className="bg-white p-4 rounded shadow-sm">
                  <label className="block text-gray-700 font-semibold mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              ))}

              {/* Select Fields */}
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
                }
              ].map((field, idx) => (
                <div key={idx} className="bg-white p-4 rounded shadow-sm">
                  <label className="block text-gray-700 font-semibold mb-1">{field.label}</label>
                  <select
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  >
                    {field.options.length > 0 && typeof field.options[0] === 'object'
                      ? (
                        <>
                          <option value="">Select {field.label}</option>
                          {field.options.map((opt, i) => (
                            <option key={i} value={opt.value}>{opt.label}</option>
                          ))}
                        </>
                      )
                      : (
                        field.options.map((opt, i) => (
                          <option key={i} value={opt}>{opt || `Select ${field.label}`}</option>
                        ))
                      )}
                  </select>
                </div>
              ))}

              {/* Profile Picture Upload */}
              <div className="bg-white p-4 rounded shadow-sm">
                <label className="block text-gray-700 font-semibold mb-1">Update Profile Picture</label>
                <input type="file" name="profile_picture" onChange={handleChange} className="w-full p-2 border rounded" />
              </div>

              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                Save Changes
              </button>
            </form>

            <hr className="my-6" />

            {/* Change Password */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <h3 className="text-xl font-bold text-green-700">Change Password</h3>

              {([
                { label: 'Old Password', name: 'old_password' },
                { label: 'New Password', name: 'new_password' },
                { label: 'Confirm New Password', name: 'confirm_password' },
              ]).map((field, idx) => (
                <div key={idx} className="bg-white p-4 rounded shadow-sm">
                  <label className="block text-gray-700 font-semibold mb-1">{field.label}</label>
                  <input
                    type="password"
                    name={field.name}
                    value={passwordData[field.name]}
                    onChange={handlePasswordChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              ))}

              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-blue-700">
                Change Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProfile;