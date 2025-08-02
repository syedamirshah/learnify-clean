import React, { useState } from 'react';
import axios from 'axios';
import logo from "../assets/logo.png";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/token/', {
        username,
        password,
      });

      const access = res.data.access;
      const refresh = res.data.refresh;
      const roleFromToken = res.data.role;
      const statusFromToken = res.data.account_status;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('role', roleFromToken);
      localStorage.setItem('account_status', statusFromToken);
      console.log("üîê Token Login ‚Üí Role:", roleFromToken, "Status:", statusFromToken);

      if (statusFromToken === 'expired') {
        alert("‚õî Your subscription has expired. Please renew.");
        setTimeout(() => {
          window.location.href = '/account/renew-subscription';
        }, 500);
        return;
      }

      const userRes = await axios.get('http://127.0.0.1:8000/api/user/me/', {
        headers: { Authorization: `Bearer ${access}` },
      });

      const userData = userRes.data;
      const status = userData.account_status;
      const role = userData.role;
      const fullName = userData.full_name;

      localStorage.setItem('account_status', status);
      localStorage.setItem('user_full_name', fullName);
      localStorage.setItem('user_role', role);
      console.log("üì¶ /me ‚Üí Role:", role, "Status:", status);

      if (role === 'student' || role === 'teacher') {
        if (status === 'expired') {
          alert("‚õî Your subscription has expired. Please renew.");
          setTimeout(() => {
            window.location.href = '/account/renew-subscription';
          }, 500);
        } else {
          window.location.href = '/';
        }
      } else {
        alert("‚ùå Admins and Managers must log in from backend.");
      }

    } catch (err) {
      if (err.response?.data?.detail) {
        alert("Login failed: " + err.response.data.detail);
      } else {
        alert("Login failed. Please check username/password.");
      }
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-white border border-green-200">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Learnify Logo" className="h-16" />
        </div>
        <h2 className="text-2xl font-bold text-center text-green-800 mb-6">
          Welcome to Learnify
        </h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full mb-4 p-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-6 p-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
