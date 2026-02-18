import { TaskRepository } from "./task.repository";
import { ProjectService } from "../project/project.service";
import { CreateTaskInput, UpdateTaskInput } from "./task.validation";
import { AppError } from "../../utils/app-error";

export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private projectService: ProjectService
  ) {}

  /**
   * GET /api/projects/:id/tasks
   * Verifies the user owns the project, then returns all its tasks.
   */
  async getTasksByProject(projectId: string, userId: string) {
    // Throws 404 / 403 if project missing or not owned
    await this.projectService.getOwnedProject(projectId, userId);
    return this.taskRepo.findAllByProject(projectId);
  }

  /**
   * POST /api/tasks
   * Verifies project ownership, then creates the task.
   */
  async createTask(input: CreateTaskInput, userId: string) {
    await this.projectService.getOwnedProject(input.projectId, userId);
    return this.taskRepo.create(input);
  }

  /**
   * PUT /api/tasks/:id
   * Verifies the task exists and belongs to a project the user owns.
   */
  async updateTask(taskId: string, input: UpdateTaskInput, userId: string) {
    const task = await this.findOwnedTask(taskId, userId);
    return this.taskRepo.update(task.id, input);
  }

  /**
   * DELETE /api/tasks/:id
   * Verifies ownership then deletes. Returns nothing (controller sends 204).
   */
  async deleteTask(taskId: string, userId: string) {
    const task = await this.findOwnedTask(taskId, userId);
    await this.taskRepo.delete(task.id);
  }

  // ── Private helper ──────────────────────────────────────────────────────

  /**
   * Shared guard: fetch a task and verify the caller owns its parent project.
   */
  private async findOwnedTask(taskId: string, userId: string) {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw AppError.notFound("Task not found");
    }

    if (task.project.ownerId !== userId) {
      throw AppError.forbidden("You do not have access to this task");
    }

    return task;
  }
}
