import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import logo from "../assets/logo.png";

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
      const res = await axiosInstance.post("token/", {
        username,
        password,
      });

      const access = res.data.access;
      const refresh = res.data.refresh;
      const roleFromToken = res.data.role;
      const statusFromToken = res.data.account_status;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
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

      // axiosInstance already attaches Authorization, but keeping it is fine too.
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

      // ✅ Standard practice: go back to where user was (next) or home
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
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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