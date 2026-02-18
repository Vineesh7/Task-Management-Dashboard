import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import authRoutes from "./modules/auth/auth.routes";
import projectRoutes from "./modules/project/project.routes";
import taskRoutes from "./modules/task/task.routes";

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://localhost:5173"
      : "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// ── Health Check ──────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);   // includes GET /:id/tasks
app.use("/api/tasks", taskRoutes);

// ── Error Handler (must be registered last) ───────────────────────────────
app.use(errorHandler);

export default app;
