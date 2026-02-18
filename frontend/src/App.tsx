import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ProjectProvider } from "./context/ProjectContext.tsx";
import { TaskProvider } from "./context/TaskContext.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { GuestRoute } from "./components/GuestRoute.tsx";
import { Layout } from "./components/Layout.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ProjectView from "./pages/ProjectView.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <TaskProvider>
            <Routes>
              {/* ── Guest-only routes (redirect to dashboard if logged in) ── */}
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* ── Protected routes (redirect to login if not logged in) ─── */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects/:id" element={<ProjectView />} />
                </Route>
              </Route>

              {/* ── Fallback ───────────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </TaskProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
