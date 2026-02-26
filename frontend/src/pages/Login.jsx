// src/pages/Login.jsx
import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

const API = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/?$/, "/")}`;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const getNextPath = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");

      // Safety: only allow internal redirects
      if (!next || typeof next !== "string") return "/";
      if (!next.startsWith("/")) return "/";
      if (next.startsWith("//")) return "/";

      return next;
    } catch {
      return "/";
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axiosInstance.post("token/", { username, password });

      const access = res.data.access;
      const refresh = res.data.refresh;
      const roleFromToken = res.data.role;
      const statusFromToken = res.data.account_status;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      // ✅ Keep your existing keys (do NOT remove)
      localStorage.setItem("role", roleFromToken);
      localStorage.setItem("account_status", statusFromToken);

      console.log("üîê Token Login ‚Üí Role:", roleFromToken, "Status:", statusFromToken);

      // If expired right away, send to payment page (matches LandingPage behavior)
      if (statusFromToken === "expired") {
        alert("Your subscription has expired. Redirecting to payment page...");
        setTimeout(() => {
          window.location.href = `${API}payments/choose/`;
        }, 500);
        return;
      }

      const userRes = await axiosInstance.get("user/me/", {
        headers: { Authorization: `Bearer ${access}` },
      });

      const userData = userRes.data;
      const status = userData.account_status;
      const role = userData.role;
      const fullName = userData.full_name;

      localStorage.setItem("account_status", status);
      localStorage.setItem("user_full_name", fullName);
      localStorage.setItem("user_role", role);

      console.log("üì¶ /me ‚Üí Role:", role, "Status:", status);

      // Block admin/manager (same as your logic)
      if (role !== "student" && role !== "teacher") {
        alert("Admins and Managers must log in from backend.");
        return;
      }

      // If expired after /me, redirect to payment
      if (status === "expired") {
        alert("Your subscription has expired. Redirecting to payment page...");
        setTimeout(() => {
          window.location.href = `${API}payments/choose/`;
        }, 500);
        return;
      }

      // ✅ Go back to where user was (next) or home
      const nextPath = getNextPath();
      window.location.href = nextPath || "/";
    } catch (err) {
      if (err.response?.data?.detail) {
        alert("Login failed: " + err.response.data.detail);
      } else {
        alert("Login failed. Please check username/password.");
      }
      console.error("Login error:", err);
    }
  };

  const nextPath = getNextPath();

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl sm:p-8">
        <div className="mb-5 text-center">
          <div className="mb-3 flex justify-center">
            <img src={logo} alt="Learnify Logo" className="h-14 sm:h-16" />
          </div>

          <h2 className="text-2xl font-bold text-green-800">Welcome to Learnify</h2>

          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            After login, you&apos;ll continue to:{" "}
            <span className="font-semibold text-gray-700">{nextPath}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="mt-6 w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          Login
        </button>

        {/* ✅ IMPORTANT: user should never be trapped */}
        <div className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="text-green-700 hover:underline font-semibold">
            ← Continue as Guest
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-left text-gray-600 hover:underline sm:text-right"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
