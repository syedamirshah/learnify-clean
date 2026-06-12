import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { resolveSchoolRouteAccess } from "../utils/schoolRouteAccess";

export default function SchoolProtectedRoute({ children }) {
  const location = useLocation();
  const accessToken = localStorage.getItem("access_token");
  const role = localStorage.getItem("user_role") || localStorage.getItem("role");
  const access = resolveSchoolRouteAccess({ accessToken, role });

  if (access === "login") {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?next=${next}`} replace />;
  }

  if (access === "denied") {
    return <Navigate to="/learn" replace />;
  }

  return children;
}
