import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/logo.png'; // ‚úÖ adjust path if needed

const SignupPage = () => {
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);

  const [grades, setGrades] = useState([]);

  useEffect(() => {
    axios.get('/api/grades/')
      .then((response) => {
        setGrades(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch grades:", error);
      });
  }, []);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    gender: '',
    language_used_at_home: '',
    schooling_status: '',
    school_name: '',
    grade: '',
    city: '',
    province: '',
    subscription_plan: '',
    profile_picture: null,
    fee_receipt: null
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append('role', role);

    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== undefined) {
        form.append(key, formData[key]);
      }
    }

    try {
      await axios.post('/api/register/', form);
      alert(
        '‚úÖ Your account has been created successfully!\n\n' +
        'Please wait 10‚Äì15 minutes while our team verifies your information and activates your account.\n' +
        'You will receive an email once your account is approved.'
      );
      navigate('/');
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 403) {
        alert('‚è≥ Your account is not active yet. Please wait for activation.');
      } else {
        alert('‚ùå Registration failed. Please check your details and try again.');
      }
    }
  };

  const schoolingOptions =
    role === 'teacher'
    ? [{ label: 'I am Teacher', value: 'I am teacher' }]
      : [
          { label: 'Public School', value: 'Public school' },
          { label: 'Private School', value: 'Private school' },
          { label: 'Homeschool', value: 'Homeschool' },
          { label: 'Madrassah', value: 'Madrassah' }
        ];

  return (
    <div className="bg-green-50 min-h-screen">
      {/* ‚úÖ Logo Top Left */}
      <nav className="w-full px-6 py-4 bg-white shadow-sm">
        <Link to="/">
          <img
            src={logo}
            alt="Learnify Home"
            className="h-24 w-auto hover:opacity-80 transition duration-200"
            style={{ background: "transparent" }}
          />
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold text-center text-green-800 mb-8">Sign Up</h2>

        <div className="flex justify-center gap-6 mb-10">
          <button
            onClick={() => setRole('student')}
            className={`px-6 py-2 rounded font-semibold text-sm ${
              role === 'student' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            I'm a Student
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`px-6 py-2 rounded font-semibold text-sm ${
              role === 'teacher' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
          >
            I'm a Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input name="username" value={formData.username} onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm" />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Full Name</label>
            <input name="full_name" value={formData.full_name} onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm" />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Schooling Status</label>
            <select name="schooling_status" value={formData.schooling_status} onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm">
              <option value="">Select Status</option>
              {schoolingOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Grade</label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm"
            >
              <option value="">Select Grade</option>
              {grades.map((grade, idx) => (
                <option key={idx} value={grade.value}>{grade.label}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Province / Region</label>
            <select name="province" value={formData.province} onChange={handleChange}
                className="w-full max-w-sm border px-3 py-2 rounded text-sm">
                <option value="">Select Province</option>
                <option value="Azad Kashmir">Azad Kashmir</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Federal Territory">Federal Territory</option> {/* ‚úÖ NEW */}
                <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                <option value="Khyber-Pakhtunkhwa">Khyber-Pakhtunkhwa</option>
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
                </select>
          </div>

          {/* Column 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm"
            />
            <div className="mt-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword((prev) => !prev)}
                className="mr-1"
              />
              Show Password
            </div>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Email</label>
            <input name="email" value={formData.email} onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm" />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Language Used at Home</label>
            <select name="language_used_at_home" value={formData.language_used_at_home} onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm">
              <option value="">Select Language</option>
              <option value="Balochi">Balochi</option>
              <option value="Brahui">Brahui</option>
              <option value="Chitrali">Chitrali</option>
              <option value="Hindko">Hindko</option>
              <option value="Other">Other</option>
              <option value="Pashto">Pashto</option>
              <option value="Punjabi">Punjabi</option>
              <option value="Saraiki">Saraiki</option>
              <option value="Sindhi">Sindhi</option>
              <option value="Urdu">Urdu</option>
            </select>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">School Name</label>
            <input name="school_name" value={formData.school_name} onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm" />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">City</label>
            <input name="city" value={formData.city} onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm" />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Subscription Plan</label>
            <select
              name="subscription_plan"
              value={formData.subscription_plan}
              onChange={handleChange}
              className="w-full max-w-sm border px-3 py-2 rounded text-sm"
            >
              <option value="">Select Plan</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* File Uploads */}
          <div className="col-span-2 flex flex-col md:flex-row justify-between items-center gap-6 mt-4">
            <div className="w-full max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Profile Picture</label>
              <input type="file" name="profile_picture" onChange={handleChange}
                className="w-full text-sm" />
            </div>
            <div className="w-full max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Fee Receipt</label>
              <input type="file" name="fee_receipt" onChange={handleChange}
                className="w-full text-sm" />
            </div>
          </div>

          {/* Submit Button */}
          <div className="col-span-2 mt-8 text-center">
            <button type="submit"
              className="w-full max-w-sm mx-auto bg-green-700 text-white py-3 rounded hover:bg-green-800 transition-all duration-300">
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
