import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { validate } from "../../middleware/validate";
import { registerSchema, loginSchema } from "./auth.validation";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// Dependency chain: Repository → Service → Controller
const authRepo = new AuthRepository();
const authService = new AuthService(authRepo);
const authController = new AuthController(authService);

router.post("/register", validate(registerSchema), asyncHandler(authController.register));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));

export default router;
