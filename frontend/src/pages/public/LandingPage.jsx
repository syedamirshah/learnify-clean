import React, { useState, useEffect } from "react";
import logo from "../../assets/logo.png";
import "../../App.css";
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const [userFullName, setFullName] = useState('');
  const [quizData, setQuizData] = useState([]);  // ‚Äö√∫√ñ NEW
  const navigate = useNavigate();

  // Load role and name
  useEffect(() => {
    const storedRole = localStorage.getItem('user_role');
    const storedName = localStorage.getItem('user_full_name');
    setRole(storedRole);
    setFullName(storedName);
  }, []);

  // Expired user redirect
  useEffect(() => {
    const status = localStorage.getItem('account_status');
    const role = localStorage.getItem('user_role');

    if ((role === 'student' || role === 'teacher') && status === 'expired') {
      alert("Your subscription has expired. Redirecting to renewal page...");
      navigate('/account/renew-subscription');
    }
  }, [navigate]);

  // Fetch quiz data from backend and log it
    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/landing/quizzes/')
        .then(res => {
            console.log("Ô£ø√º√¨¬∂ Quiz API Response:", res.data);  // ‚Äö√∫√ñ Right place to log
            setQuizData(res.data);
        })
        .catch(err => console.error("‚Äö√π√• Error fetching quizzes:", err));
    }, []);

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/token/', {
        username,
        password,
      });

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('account_status', res.data.account_status);
      localStorage.setItem('role', res.data.role);

      const me = await axios.get('http://127.0.0.1:8000/api/user/me/', {
        headers: {
          Authorization: `Bearer ${res.data.access}`,
        },
      });

      const role = me.data.role;
      const fullName = me.data.full_name || me.data.username;
      const status = me.data.account_status;

      if (role === 'admin' || role === 'manager') {
        alert("Admins and Managers must login from the backend.");
        return;
      }

      localStorage.setItem('user_role', role);
      localStorage.setItem('user_full_name', fullName);
      localStorage.setItem('account_status', status);
      setRole(role);
      setFullName(fullName);

      if ((role === 'student' || role === 'teacher') && status === 'expired') {
        navigate('/account/renew-subscription');
      } else {
        navigate('/');
      }

    } catch (err) {
      if (err.response?.data?.detail) {
        alert("Login failed: " + err.response.data.detail);
      } else {
        alert("Login failed: Server error");
      }
      console.error("Login error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_full_name');
    localStorage.removeItem('account_status');
    setRole(null);
    setFullName('');
    window.location.href = '/';
  };

  return (
    <div className="bg-white min-h-screen font-[Calibri] text-gray-800">
      <header className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="flex items-center space-x-6">
          <img src={logo} alt="Learnify Pakistan Logo" className="h-24" />
          {userFullName && (
            <span className="text-lg font-semibold text-gray-700 italic">
              Welcome, {userFullName}
            </span>
          )}
        </div>

        <div className="flex gap-4 items-center">
          {role ? (
            <button
              onClick={handleLogout}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            >
              Logout
            </button>
          ) : (
            <>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="px-3 py-1 border rounded"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-3 py-1 border rounded"
              />
              <button
                onClick={handleLogin}
                className="bg-[#42b72a] text-white px-4 py-1 rounded hover:bg-green-700"
              >
                Sign in
              </button>
              <label className="ml-2 text-sm">
                <input type="checkbox" className="mr-1" /> Remember
              </label>
            </>
          )}
        </div>
      </header>

      <nav className="flex justify-evenly items-center text-center text-lg font-normal bg-[#42b72a] text-white relative z-30">
        <div className="py-2">
          <Link to="/why-join" className="text-white hover:underline">
            Why Join Learnify?
          </Link>
        </div>

        {/* Assessment Section */}
        <div className="relative group py-2">
          {role === 'student' && (
            <>
              <button className="text-white hover:underline font-normal">Assessment</button>
              <div className="absolute left-0 mt-2 w-60 hidden group-hover:flex flex-col bg-white text-black shadow-lg rounded z-50">
                <Link to="/student/assessment" className="px-4 py-2 hover:bg-gray-100">Subject-wise Performance</Link>
                <Link to="/student/quiz-history" className="px-4 py-2 hover:bg-gray-100">Quiz History</Link>
              </div>
            </>
          )}

          {role === 'teacher' && (
            <Link to="/teacher/assessment" className="text-white hover:underline font-normal">Assessment</Link>
          )}

          {!role && (
            <Link to="/assessment/public" className="text-white hover:underline font-normal">Assessment</Link>
          )}
        </div>

        <div className="py-2">
          <Link to="/honor-board" className="text-white hover:underline">Learnify Heroes</Link>
        </div>

        <div className="py-2">
          <Link to="/membership" className="text-white hover:underline">Membership</Link>
        </div>

        <div className="py-2">
          <Link to="/help-center" className="text-white hover:underline">Help Center</Link>
        </div>

        {/* Account Settings */}
        {role && (
          <div className="relative group py-2">
            <button className="text-white hover:underline font-normal">Account Settings</button>
            <div className="absolute right-0 mt-2 w-56 hidden group-hover:flex flex-col bg-white text-black shadow-lg rounded z-50">
              <Link to="/account/renew-subscription" className="px-4 py-2 hover:bg-gray-100">Renew Subscription</Link>
              <Link to="/account/edit-profile" className="px-4 py-2 hover:bg-gray-100">Edit Profile</Link>
            </div>
          </div>
        )}

        {!role && (
          <div>
            <a href="/signup" className="text-white hover:underline">Sign up</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-[#f6fff6] border border-green-300 shadow-md rounded-xl mt-10 p-8 max-w-7xl mx-auto">
        <h2 className="text-3xl text-center font-bold text-[#1E7F12] mb-4">
          Learnify Pakistan: A Smarter Way to Learn
        </h2>

        <p className="text-lg text-gray-700 text-center max-w-4xl mx-auto">
          Learnify Pakistan is a modern digital learning platform designed especially for primary school students, teachers, and parents. Fully aligned with the National Curriculum, it offers an inclusive and affordable way to master school subjects, track performance in real time, and foster meaningful learning - inside and outside the classroom. Learnify brings education to life through unlimited quizzes, smart feedback, and parent-teacher visibility like never before.
        </p>
      </section>

      {/* Ô£ø√º√Æ√ë Dynamic Quiz View */}
      <div className="mt-14 px-6">
        {quizData.map((gradeItem, gradeIndex) => (
            <div key={`grade-${gradeIndex}`} className="mb-12">
            {/* ‚Äö√∫√ñ Grade Heading (Only Once) */}
            <h2 className="text-2xl font-bold text-green-800 text-center mb-4">
                {gradeItem.grade}
            </h2>

            {gradeItem.subjects.map((subjectItem, subjectIndex) => (
                <div key={`subject-${gradeIndex}-${subjectIndex}`} className="mb-10">
                {/* ‚Äö√∫√ñ Subject Name */}
                <h3 className="text-xl text-green-700 font-semibold text-center mb-4">
                    {subjectItem.subject}
                </h3>

                {/* ‚Äö√∫√ñ Chapters and Quizzes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {subjectItem.chapters.map((chapterItem, chapterIndex) => (
                    <div key={`chapter-${chapterIndex}`} className="bg-white px-2">
                        {/* ‚Äö√∫√ñ Chapter Title (left-aligned like quizzes) */}
                        <div className="mb-2">
                        <span className="text-green-700 font-bold text-base">
                            {chapterItem.chapter}.
                        </span>
                        </div>

                        {/* ‚Äö√∫√ñ Numbered Quiz List with normal weight */}
                        <div className="space-y-1">
                        {chapterItem.quizzes.map((quiz, quizIndex) => (
                            <div key={`quiz-${quiz.id}`} className="flex items-start gap-2 ml-1">
                            <span className="text-gray-700">{quizIndex + 1}.</span>
                            <Link
                            to={`/student/attempt-quiz/${quiz.id}`}
                            className="text-green-800 hover:text-green-600 hover:underline"
                            >
                            {quiz.title}
                            </Link>
                            </div>
                        ))}
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            ))}
            </div>
        ))}
        </div>
    </div>
  );
};

export default LandingPage;

