import { Request, Response } from "express";
import { ProjectService } from "./project.service";
import { sendSuccess, sendCreated } from "../../utils/response";

export class ProjectController {
  constructor(private projectService: ProjectService) {}

  /**
   * GET /api/projects
   * Returns all projects owned by the authenticated user.
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    const projects = await this.projectService.getAllProjects(req.user!.userId);
    sendSuccess(res, projects);
  };

  /**
   * POST /api/projects
   * Creates a new project. Body: { name, description? }
   */
  create = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectService.createProject(
      req.body,
      req.user!.userId
    );
    sendCreated(res, project);
  };
}
