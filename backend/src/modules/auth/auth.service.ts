import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { AuthRepository } from "./auth.repository";
import { RegisterInput, LoginInput } from "./auth.validation";

const SALT_ROUNDS = 10;

export class AuthService {
  constructor(private authRepo: AuthRepository) {}

  // ── Register ────────────────────────────────────────────────────────────

  async register(input: RegisterInput) {
    // 1. Check for duplicate email
    const existing = await this.authRepo.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict("Email already registered");
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // 3. Persist user (repository returns record WITHOUT password)
    const user = await this.authRepo.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
    });

    // 4. Generate JWT
    const token = this.generateToken(user.id, user.email);

    return { user, token };
  }

  // ── Login ───────────────────────────────────────────────────────────────

  async login(input: LoginInput) {
    // 1. Look up user (includes password hash for comparison)
    const user = await this.authRepo.findByEmail(input.email);
    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    // 2. Verify password
    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    // 3. Generate JWT
    const token = this.generateToken(user.id, user.email);

    // 4. Return user without password
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as string,
    } as jwt.SignOptions);
  }
}
