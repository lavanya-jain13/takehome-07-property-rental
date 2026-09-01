import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  allowedRoles,
  redirectTo = "/dashboard",
}: ProtectedRouteProps) {
  const { isAuthenticated, user } =
    useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    (!user || !allowedRoles.includes(user.role))
  ) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
