import React, { useState, useEffect } from "react";
import logo from "../../assets/logo.png";
import "../../App.css";
import axiosInstance from '../../utils/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import heroBanner from "../../assets/learnify-hero.png"; // ⬅️ NEW


const API = `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/?$/, '/')}`;

const LandingPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null);
  const [userFullName, setFullName] = useState('');
  const [quizData, setQuizData] = useState([]);
  const navigate = useNavigate();

  // Force full-page light-green background everywhere
  useEffect(() => {
    const prevBG = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#f6fff6';
    return () => { document.body.style.backgroundColor = prevBG; };
  }, []);

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
      alert("Your subscription has expired. Redirecting to payment page...");
      window.location.href = `${API}payments/choose/`;
    }
  }, []);

  // Fetch quiz data from backend and log it
  useEffect(() => {
    import('axios').then(({ default: axios }) => {
      axios.get(`${API}landing/quizzes/`)
        .then(res => {
          console.log("✅ Public Quiz API Response:", res.data);
          setQuizData(res.data);
        })
        .catch(err => console.error("❌ Error fetching quizzes:", err));
    });
  }, []);

  const handleLogin = async () => {
    try {
      const res = await axiosInstance.post('token/', { username, password });

      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('account_status', res.data.account_status);
      localStorage.setItem('role', res.data.role);

      const me = await axiosInstance.get('user/me/');
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
        window.location.href = `${API}payments/choose/`;
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

  // ====== existing helpers (unchanged) ======
  const chapterWeight = (ch) =>
    1 + (Array.isArray(ch.quizzes) ? ch.quizzes.length : 0);

  const splitChaptersBalanced = (chapters, cols = 3) => {
    const total = chapters.reduce((s, ch) => s + chapterWeight(ch), 0);
    const target = Math.ceil(total / cols);

    const out = Array.from({ length: cols }, () => []);
    let col = 0;
    let used = 0;

    chapters.forEach((ch, i) => {
      const w = chapterWeight(ch);
      const remainingChapters = chapters.length - i - 1;
      const remainingCols = cols - col - 1;

      if (used > 0 && used + w > target && remainingCols >= 1) {
        col += 1;
        used = 0;
      }
      out[col].push(ch);
      used += w;
    });

    return out;
  };

  // Soft neutral tints we’ll cycle through for chapter cards
  const chapterCardTints = [
    "bg-gray-100",   // neutral
    "bg-green-100",  // very light green
    "bg-blue-100",   // soft blue
    "bg-yellow-100", // pale yellow
    "bg-pink-100",   // soft pink
    "bg-purple-100", // lavender
    "bg-teal-100",   // mint
    "bg-orange-100", // peach
  ];

  return (
    <div className="min-h-screen font-[Nunito] text-gray-800 bg-[#f6fff6]">
      {/* Header */}
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

      {/* Navbar */}
      <nav className="flex justify-evenly items-center text-center text-lg font-normal bg-[#42b72a] text-white relative z-30">
        <div className="py-2">
          <Link to="/why-join" className="text-white hover:underline">
            Why Join Learnify?
          </Link>
        </div>

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

        {role && (
          <div className="relative group py-2">
            <button className="text-white hover:underline font-normal">Account Settings</button>
            <div className="absolute right-0 mt-2 w-56 hidden group-hover:flex flex-col bg-white text-black shadow-lg rounded z-50">
            <a
                href={`${API}payments/choose/`}
                className="px-4 py-2 hover:bg-gray-100"
              >
                Make Payment
              </a>
              <Link to="/account/edit-profile" className="px-4 py-2 hover:bg-gray-100">Edit Profile</Link>
            </div>
          </div>
        )}

        {!role && (
          <div className="relative group py-2">
            <button className="text-white hover:underline font-normal">Sign up</button>
            <div className="absolute right-0 mt-2 w-60 hidden group-hover:flex flex-col bg-white text-black shadow-lg rounded z-50">
              {/* Create account (existing SPA route) */}
              <Link to="/signup" className="px-4 py-2 hover:bg-gray-100">
                Create Account
              </Link>

              {/* Make payment (server-rendered flow) */}
              <a
              href={`${API}payments/choose/`}
              className="px-4 py-2 hover:bg-gray-100"
            >
              Make Payment
            </a>
            </div>
          </div>
        )}
      </nav>

            {/* Hero Section */}
            <section className="w-full mt-10">

            <div 
              className="w-full bg-[#f6fff6] flex justify-center items-center overflow-hidden"
              style={{ height: "310px" }}   // adjust 350 / 400 / 450 as you like
            >
              <img
                src={heroBanner}
                alt="Learnify Pakistan Hero Banner"
                className="h-full object-contain"
                style={{ objectPosition: "center center" }}
              />
            </div>

</section>
      {/* Dynamic Quiz View */}
      <div className="mt-10 px-6 max-w-[1200px] mx-auto">
        {quizData.map((gradeItem, gradeIndex) => (
          <div key={`grade-${gradeIndex}`} className="mb-12">
            {/* (i) tighter gap above subjects */}
            <h2 className="text-2xl font-bold text-green-800 text-center mb-3">
              {gradeItem.grade}
            </h2>

            {gradeItem.subjects.map((subjectItem, subjectIndex) => (
              <div key={`subject-${gradeIndex}-${subjectIndex}`} className="mb-8">
                {/* subject label only */}
                <h3 className="text-xl text-green-700 font-extrabold text-center mb-3">
                  {subjectItem.subject}
                </h3>

                {/* Each CHAPTER is a card; balanced into 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                  {(() => {
                    // local counter to cycle colors across cards
                    let colorCounter = 0;
                    return splitChaptersBalanced(subjectItem.chapters, 3).map((column, colIdx) => (
                      <div key={`col-${subjectIndex}-${colIdx}`} className="flex flex-col gap-6 h-full">
                        {column.map((chapterItem, chapterIndex) => {
                          const tint = chapterCardTints[colorCounter % chapterCardTints.length];
                          colorCounter += 1;
                          return (
                            <article
                              key={`chapter-${colIdx}-${chapterIndex}`}
                              className={`rounded-2xl shadow border border-gray-200 ${tint} p-5`}
                            >
                              {/* (v) removed sticker/emoji */}

                              {/* Chapter title */}
                              <div className="mb-2">
                                <span className="text-green-800 font-bold">
                                  {chapterItem.chapter}.
                                </span>
                              </div>

                              {/* (iii) no bullets; (iv) left aligned */}
                              <ul className="list-none pl-0 ml-0 space-y-1 text-left">
                                {[...chapterItem.quizzes]
                                  .sort((a, b) => {
                                    const numA = parseInt((a.title || '').trim().match(/^\d+/)?.[0] ?? '999999', 10);
                                    const numB = parseInt((b.title || '').trim().match(/^\d+/)?.[0] ?? '999999', 10);
                                    if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) return numA - numB;
                                    return (a.title || '').localeCompare(b.title || '');
                                  })
                                  .map((quiz) => (
                                    <li key={`quiz-${quiz.id}`}>
                                      <Link
                                        to={`/student/attempt-quiz/${quiz.id}`}
                                        className="inline-block text-green-900 hover:text-green-700 hover:underline"
                                      >
                                        {quiz.title}
                                      </Link>
                                    </li>
                                  ))}
                              </ul>
                            </article>
                          );
                        })}
                      </div>
                    ));
                  })()}
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