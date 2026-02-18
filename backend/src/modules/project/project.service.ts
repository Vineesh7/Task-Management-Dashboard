import { ProjectRepository } from "./project.repository";
import { CreateProjectInput } from "./project.validation";
import { AppError } from "../../utils/app-error";

export class ProjectService {
  constructor(private projectRepo: ProjectRepository) {}

  /**
   * GET /api/projects — all projects for the authenticated user.
   */
  async getAllProjects(userId: string) {
    return this.projectRepo.findAllByOwner(userId);
  }

  /**
   * Shared ownership gate — used by task endpoints to verify the user
   * owns the project before reading/writing tasks.
   */
  async getOwnedProject(projectId: string, userId: string) {
    const project = await this.projectRepo.findById(projectId);

    if (!project) {
      throw AppError.notFound("Project not found");
    }

    if (project.ownerId !== userId) {
      throw AppError.forbidden("You do not have access to this project");
    }

    return project;
  }

  /**
   * POST /api/projects — create a project owned by the authenticated user.
   */
  async createProject(input: CreateProjectInput, userId: string) {
    return this.projectRepo.create({ ...input, ownerId: userId });
  }
}
