import prisma from "../../config/database";
import { CreateProjectInput } from "./project.validation";

// Shared include/select for consistent project shape across all queries
const projectWithCounts = {
  include: {
    _count: {
      select: { tasks: true },
    },
    tasks: {
      select: { status: true },
    },
  },
} as const;

/** Collapses the raw tasks array into per-status counts. */
function addStatusCounts<
  T extends { tasks: { status: string }[]; _count: { tasks: number } },
>(project: T) {
  const { tasks, ...rest } = project;
  return {
    ...rest,
    taskCounts: {
      total: rest._count.tasks,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
    },
  };
}

export class ProjectRepository {
  /**
   * All projects owned by a user, with per-status task counts for the dashboard.
   */
  async findAllByOwner(ownerId: string) {
    const projects = await prisma.project.findMany({
      where: { ownerId },
      ...projectWithCounts,
      orderBy: { createdAt: "desc" },
    });

    return projects.map(addStatusCounts);
  }

  /**
   * Single project by ID. Returns null if not found.
   */
  async findById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      ...projectWithCounts,
    });

    return project ? addStatusCounts(project) : null;
  }

  /**
   * Create a project and return it with initial task counts (all zeros).
   */
  async create(data: CreateProjectInput & { ownerId: string }) {
    const project = await prisma.project.create({
      data,
      ...projectWithCounts,
    });

    return addStatusCounts(project);
  }
}
