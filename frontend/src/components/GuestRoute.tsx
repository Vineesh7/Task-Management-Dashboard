import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.ts";
import { Spinner } from "./ui/Spinner.tsx";

/**
 * Reverse of ProtectedRoute — only accessible when NOT logged in.
 * If already authenticated, redirects to /dashboard.
 */
export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner />;

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
