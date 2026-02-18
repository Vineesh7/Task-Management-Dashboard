import { Router } from "express";
import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";
import { ProjectRepository } from "./project.repository";
import { TaskController } from "../task/task.controller";
import { TaskService } from "../task/task.service";
import { TaskRepository } from "../task/task.repository";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createProjectSchema } from "./project.validation";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// ── Dependency wiring ─────────────────────────────────────────────────────
const projectRepo = new ProjectRepository();
const projectService = new ProjectService(projectRepo);
const projectController = new ProjectController(projectService);

const taskRepo = new TaskRepository();
const taskService = new TaskService(taskRepo, projectService);
const taskController = new TaskController(taskService);

// ── All project routes require authentication ─────────────────────────────
router.use(authenticate);

// ── Project endpoints ─────────────────────────────────────────────────────
router.get("/", asyncHandler(projectController.getAll));
router.post("/", validate(createProjectSchema), asyncHandler(projectController.create));

// ── Nested: tasks for a project ───────────────────────────────────────────
router.get("/:id/tasks", asyncHandler(taskController.getByProject));

export default router;
