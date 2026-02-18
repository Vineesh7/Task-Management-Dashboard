import prisma from "../../config/database";

// Fields returned for safe (no password) user responses
const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} as const;

export class AuthRepository {
  /**
   * Find a user by email — includes password hash for credential verification.
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  /**
   * Create a new user and return the record WITHOUT the password field.
   */
  async create(data: { email: string; password: string; name: string }) {
    return prisma.user.create({
      data,
      select: safeUserSelect,
    });
  }
}
