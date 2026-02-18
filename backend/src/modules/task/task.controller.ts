import { Request, Response } from "express";
import { TaskService } from "./task.service";
import { sendSuccess, sendCreated } from "../../utils/response";

export class TaskController {
  constructor(private taskService: TaskService) {}

  /**
   * GET /api/projects/:id/tasks
   * Returns all tasks for a project (Kanban board data).
   */
  getByProject = async (req: Request, res: Response): Promise<void> => {
    const tasks = await this.taskService.getTasksByProject(
      req.params.id as string,
      req.user!.userId
    );
    sendSuccess(res, tasks);
  };

  /**
   * POST /api/tasks
   * Body: { title, projectId, description?, status?, priority?, assigneeId?, dueDate? }
   */
  create = async (req: Request, res: Response): Promise<void> => {
    const task = await this.taskService.createTask(req.body, req.user!.userId);
    sendCreated(res, task);
  };

  /**
   * PUT /api/tasks/:id
   * Body: any subset of { title, description, status, priority, position, assigneeId, dueDate }
   */
  update = async (req: Request, res: Response): Promise<void> => {
    const task = await this.taskService.updateTask(
      req.params.id as string,
      req.body,
      req.user!.userId
    );
    sendSuccess(res, task);
  };

  /**
   * DELETE /api/tasks/:id
   * Returns 204 No Content on success.
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    await this.taskService.deleteTask(req.params.id as string, req.user!.userId);
    res.status(204).send();
  };
}
