import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { Spinner } from "./ui/Spinner.tsx";

/**
 * Wraps authenticated routes. If not logged in, redirects to /login
 * and preserves the intended destination in location state so the
 * Login page can redirect back after successful authentication.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
