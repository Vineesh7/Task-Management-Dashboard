import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthService } from "../src/modules/auth/auth.service";
import { AuthRepository } from "../src/modules/auth/auth.repository";
import { AppError } from "../src/utils/app-error";

// ── Mock the repository ───────────────────────────────────────────────────
// Every method is a jest.fn() — no database calls will ever execute.
function createMockAuthRepo(): jest.Mocked<AuthRepository> {
  return {
    findByEmail: jest.fn(),
    create: jest.fn(),
  } as jest.Mocked<AuthRepository>;
}

describe("AuthService", () => {
  let authService: AuthService;
  let mockRepo: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    mockRepo = createMockAuthRepo();
    authService = new AuthService(mockRepo);
  });

  // ─────────────────────────────────────────────────────────────────────
  // TEST 1: Successful registration
  // ─────────────────────────────────────────────────────────────────────
  describe("register", () => {
    it("should hash the password, persist the user, and return a JWT", async () => {
      // Arrange
      const input = { email: "alice@test.com", password: "secret123", name: "Alice" };

      mockRepo.findByEmail.mockResolvedValue(null); // no duplicate
      mockRepo.create.mockResolvedValue({
        id: "user-1",
        email: input.email,
        name: input.name,
        createdAt: new Date(),
      });

      // Act
      const result = await authService.register(input);

      // Assert — password was hashed (not stored as plaintext)
      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.password).not.toBe(input.password);
      const isHashed = await bcrypt.compare(input.password, createCall.password);
      expect(isHashed).toBe(true);

      // Assert — response contains user without password and a valid JWT
      expect(result.user).toEqual(
        expect.objectContaining({ id: "user-1", email: "alice@test.com", name: "Alice" })
      );
      expect(result.user).not.toHaveProperty("password");

      const decoded = jwt.decode(result.token) as any;
      expect(decoded.userId).toBe("user-1");
      expect(decoded.email).toBe("alice@test.com");
    });

    // ───────────────────────────────────────────────────────────────────
    // TEST 2: Duplicate email
    // ───────────────────────────────────────────────────────────────────
    it("should throw 409 when email already exists", async () => {
      // Arrange
      const input = { email: "alice@test.com", password: "secret123", name: "Alice" };

      mockRepo.findByEmail.mockResolvedValue({
        id: "user-1",
        email: input.email,
        password: "hashed",
        name: "Alice",
        createdAt: new Date(),
      });

      // Act & Assert
      await expect(authService.register(input)).rejects.toThrow(AppError);
      await expect(authService.register(input)).rejects.toMatchObject({
        statusCode: 409,
        message: "Email already registered",
      });

      // create should never have been called
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // TEST 3: Successful login
  // ─────────────────────────────────────────────────────────────────────
  describe("login", () => {
    it("should return user without password and a valid JWT on correct credentials", async () => {
      // Arrange
      const plainPassword = "secret123";
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      mockRepo.findByEmail.mockResolvedValue({
        id: "user-1",
        email: "alice@test.com",
        password: hashedPassword,
        name: "Alice",
        createdAt: new Date(),
      });

      // Act
      const result = await authService.login({
        email: "alice@test.com",
        password: plainPassword,
      });

      // Assert — user object has no password
      expect(result.user).toEqual({ id: "user-1", email: "alice@test.com", name: "Alice" });
      expect(result.user).not.toHaveProperty("password");

      // Assert — token is valid
      const decoded = jwt.decode(result.token) as any;
      expect(decoded.userId).toBe("user-1");
    });

    // ───────────────────────────────────────────────────────────────────
    // TEST 4: Wrong password
    // ───────────────────────────────────────────────────────────────────
    it("should throw 401 when password is incorrect", async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash("correct-password", 10);

      mockRepo.findByEmail.mockResolvedValue({
        id: "user-1",
        email: "alice@test.com",
        password: hashedPassword,
        name: "Alice",
        createdAt: new Date(),
      });

      // Act & Assert
      await expect(
        authService.login({ email: "alice@test.com", password: "wrong-password" })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid email or password",
      });
    });

    // ───────────────────────────────────────────────────────────────────
    // TEST 5: Non-existent user
    // ───────────────────────────────────────────────────────────────────
    it("should throw 401 when user does not exist", async () => {
      // Arrange
      mockRepo.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login({ email: "nobody@test.com", password: "anything" })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid email or password",
      });
    });
  });
});
