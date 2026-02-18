import { Router } from "express";
import { TaskController } from "./task.controller";
import { TaskService } from "./task.service";
import { TaskRepository } from "./task.repository";
import { ProjectService } from "../project/project.service";
import { ProjectRepository } from "../project/project.repository";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createTaskSchema, updateTaskSchema } from "./task.validation";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// ── Dependency wiring ─────────────────────────────────────────────────────
const projectRepo = new ProjectRepository();
const projectService = new ProjectService(projectRepo);
const taskRepo = new TaskRepository();
const taskService = new TaskService(taskRepo, projectService);
const taskController = new TaskController(taskService);

// ── All task routes require authentication ────────────────────────────────
router.use(authenticate);

router.post("/", validate(createTaskSchema), asyncHandler(taskController.create));
router.put("/:id", validate(updateTaskSchema), asyncHandler(taskController.update));
router.delete("/:id", asyncHandler(taskController.delete));

export default router;
