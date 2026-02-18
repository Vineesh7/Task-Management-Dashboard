import prisma from "../../config/database";
import { CreateTaskInput, UpdateTaskInput } from "./task.validation";

export class TaskRepository {
  /**
   * All tasks in a project, ordered for Kanban display:
   * status ASC (TODO → IN_PROGRESS → DONE), then position ASC within each column.
   * Includes assignee name for card rendering.
   */
  async findAllByProject(projectId: string) {
    return prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Single task with project ownership info for authorization checks.
   */
  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { ownerId: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async create(data: CreateTaskInput) {
    return prisma.task.create({
      data,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateTaskInput) {
    return prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.task.delete({ where: { id } });
  }
}
