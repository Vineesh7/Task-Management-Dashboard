import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { sendCreated, sendSuccess } from "../../utils/response";

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Body: { email, password, name }
   * Returns 201 with { user, token }
   */
  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body);
    sendCreated(res, result);
  };

  /**
   * POST /api/auth/login
   * Body: { email, password }
   * Returns 200 with { user, token }
   */
  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body);
    sendSuccess(res, result);
  };
}
