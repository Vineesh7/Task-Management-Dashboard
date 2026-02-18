import { ProjectService } from "../src/modules/project/project.service";
import { ProjectRepository } from "../src/modules/project/project.repository";
import { AppError } from "../src/utils/app-error";

// ── Mock the repository ───────────────────────────────────────────────────
function createMockProjectRepo(): jest.Mocked<ProjectRepository> {
  return {
    findAllByOwner: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  } as jest.Mocked<ProjectRepository>;
}

/** Helper to build a mock project with the new taskCounts shape */
function mockProject(overrides: {
  id?: string;
  name?: string;
  description?: string | null;
  ownerId: string;
  totalTasks?: number;
}) {
  const total = overrides.totalTasks ?? 0;
  return {
    id: overrides.id ?? "proj-1",
    name: overrides.name ?? "Sprint 1",
    description: overrides.description ?? null,
    ownerId: overrides.ownerId,
    createdAt: new Date(),
    _count: { tasks: total },
    taskCounts: { total, todo: total, inProgress: 0, done: 0 },
  };
}

const USER_ID = "user-1";
const OTHER_USER_ID = "user-999";

describe("ProjectService", () => {
  let service: ProjectService;
  let mockRepo: jest.Mocked<ProjectRepository>;

  beforeEach(() => {
    mockRepo = createMockProjectRepo();
    service = new ProjectService(mockRepo);
  });

  // ─────────────────────────────────────────────────────────────────────
  // TEST 6: Create project
  // ─────────────────────────────────────────────────────────────────────
  describe("createProject", () => {
    it("should create a project owned by the authenticated user", async () => {
      // Arrange
      const input = { name: "Sprint 1", description: "First sprint" };
      const created = mockProject({
        ownerId: USER_ID,
        name: input.name,
        description: input.description,
      });
      mockRepo.create.mockResolvedValue(created);

      // Act
      const result = await service.createProject(input, USER_ID);

      // Assert — repository received correct ownerId
      expect(mockRepo.create).toHaveBeenCalledWith({
        name: "Sprint 1",
        description: "First sprint",
        ownerId: USER_ID,
      });

      // Assert — returns the created project with task counts
      expect(result).toEqual(
        expect.objectContaining({
          id: "proj-1",
          name: "Sprint 1",
          ownerId: USER_ID,
          taskCounts: { total: 0, todo: 0, inProgress: 0, done: 0 },
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // TEST 7: Ownership gate — success
  // ─────────────────────────────────────────────────────────────────────
  describe("getOwnedProject", () => {
    it("should return the project when the user is the owner", async () => {
      // Arrange
      const project = mockProject({ ownerId: USER_ID, totalTasks: 3 });
      mockRepo.findById.mockResolvedValue(project);

      // Act
      const result = await service.getOwnedProject("proj-1", USER_ID);

      // Assert
      expect(result).toEqual(project);
    });

    // ───────────────────────────────────────────────────────────────────
    // TEST 8: Ownership gate — forbidden
    // ───────────────────────────────────────────────────────────────────
    it("should throw 403 when the user does not own the project", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(
        mockProject({ ownerId: OTHER_USER_ID })
      );

      // Act & Assert
      await expect(
        service.getOwnedProject("proj-1", USER_ID)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "You do not have access to this project",
      });
    });

    // ───────────────────────────────────────────────────────────────────
    // TEST 9: Ownership gate — not found
    // ───────────────────────────────────────────────────────────────────
    it("should throw 404 when the project does not exist", async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getOwnedProject("nonexistent", USER_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Project not found",
      });
    });
  });
});
