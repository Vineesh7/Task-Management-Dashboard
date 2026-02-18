import { TaskService } from "../src/modules/task/task.service";
import { TaskRepository } from "../src/modules/task/task.repository";
import { ProjectService } from "../src/modules/project/project.service";
import { AppError } from "../src/utils/app-error";

// ── Mock factories ────────────────────────────────────────────────────────
function createMockTaskRepo(): jest.Mocked<TaskRepository> {
  return {
    findAllByProject: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<TaskRepository>;
}

function createMockProjectService(): jest.Mocked<ProjectService> {
  return {
    getAllProjects: jest.fn(),
    getOwnedProject: jest.fn(),
    createProject: jest.fn(),
  } as unknown as jest.Mocked<ProjectService>;
}

// ── Shared fixtures ───────────────────────────────────────────────────────
const USER_ID = "user-1";
const OTHER_USER_ID = "user-999";
const PROJECT_ID = "proj-1";
const TASK_ID = "task-1";

const mockProject = {
  id: PROJECT_ID,
  name: "Sprint 1",
  description: null,
  ownerId: USER_ID,
  createdAt: new Date(),
  _count: { tasks: 1 },
  taskCounts: { total: 1, todo: 1, inProgress: 0, done: 0 },
};

const mockTask = {
  id: TASK_ID,
  title: "Fix bug",
  description: null,
  status: "TODO" as const,
  priority: "MEDIUM" as const,
  position: 0,
  dueDate: null,
  projectId: PROJECT_ID,
  assigneeId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  project: { ownerId: USER_ID },
  assignee: null,
};

describe("TaskService", () => {
  let service: TaskService;
  let mockTaskRepo: jest.Mocked<TaskRepository>;
  let mockProjectService: jest.Mocked<ProjectService>;

  beforeEach(() => {
    mockTaskRepo = createMockTaskRepo();
    mockProjectService = createMockProjectService();
    service = new TaskService(mockTaskRepo, mockProjectService);
  });

  // ─────────────────────────────────────────────────────────────────────
  // TEST 10: Create task
  // ─────────────────────────────────────────────────────────────────────
  describe("createTask", () => {
    it("should verify project ownership then create the task", async () => {
      // Arrange
      const input = {
        title: "Fix bug",
        projectId: PROJECT_ID,
        status: "TODO" as const,
        priority: "HIGH" as const,
      };

      mockProjectService.getOwnedProject.mockResolvedValue(mockProject);
      mockTaskRepo.create.mockResolvedValue({
        ...mockTask,
        priority: "HIGH",
      });

      // Act
      const result = await service.createTask(input, USER_ID);

      // Assert — ownership was checked first
      expect(mockProjectService.getOwnedProject).toHaveBeenCalledWith(
        PROJECT_ID,
        USER_ID
      );

      // Assert — repository received the full input
      expect(mockTaskRepo.create).toHaveBeenCalledWith(input);

      // Assert — returns the created task
      expect(result).toMatchObject({
        id: TASK_ID,
        title: "Fix bug",
        priority: "HIGH",
      });
    });

    // ───────────────────────────────────────────────────────────────────
    // TEST 11: Create task for non-owned project
    // ───────────────────────────────────────────────────────────────────
    it("should throw 403 when user does not own the target project", async () => {
      // Arrange
      const input = {
        title: "Fix bug",
        projectId: PROJECT_ID,
        status: "TODO" as const,
        priority: "MEDIUM" as const,
      };

      mockProjectService.getOwnedProject.mockRejectedValue(
        AppError.forbidden("You do not have access to this project")
      );

      // Act & Assert
      await expect(service.createTask(input, OTHER_USER_ID)).rejects.toMatchObject({
        statusCode: 403,
      });

      // Assert — task was never created
      expect(mockTaskRepo.create).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // TEST 12: Update task status (the drag-and-drop use case)
  // ─────────────────────────────────────────────────────────────────────
  describe("updateTask", () => {
    it("should update the task status from TODO to DONE", async () => {
      // Arrange
      mockTaskRepo.findById.mockResolvedValue(mockTask);
      mockTaskRepo.update.mockResolvedValue({
        ...mockTask,
        status: "DONE",
        updatedAt: new Date(),
      });

      // Act
      const result = await service.updateTask(
        TASK_ID,
        { status: "DONE" },
        USER_ID
      );

      // Assert — update was called with correct args
      expect(mockTaskRepo.update).toHaveBeenCalledWith(TASK_ID, { status: "DONE" });

      // Assert — returned task reflects the new status
      expect(result.status).toBe("DONE");
    });

    // ───────────────────────────────────────────────────────────────────
    // TEST 13: Update task — not found
    // ───────────────────────────────────────────────────────────────────
    it("should throw 404 when task does not exist", async () => {
      // Arrange
      mockTaskRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateTask("nonexistent", { status: "DONE" }, USER_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Task not found",
      });

      // Assert — update was never attempted
      expect(mockTaskRepo.update).not.toHaveBeenCalled();
    });

    // ───────────────────────────────────────────────────────────────────
    // TEST 14: Update task — forbidden (another user's project)
    // ───────────────────────────────────────────────────────────────────
    it("should throw 403 when user does not own the task's project", async () => {
      // Arrange — task belongs to a project owned by someone else
      mockTaskRepo.findById.mockResolvedValue({
        ...mockTask,
        project: { ownerId: OTHER_USER_ID },
      });

      // Act & Assert
      await expect(
        service.updateTask(TASK_ID, { status: "DONE" }, USER_ID)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "You do not have access to this task",
      });

      expect(mockTaskRepo.update).not.toHaveBeenCalled();
    });
  });
});
