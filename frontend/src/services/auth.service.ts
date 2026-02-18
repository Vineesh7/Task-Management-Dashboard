import api from "./api.ts";
import type {
  ApiResponse,
  AuthPayload,
  LoginInput,
  RegisterInput,
} from "../types/index.ts";

export const authService = {
  async register(input: RegisterInput): Promise<AuthPayload> {
    const { data } = await api.post<ApiResponse<AuthPayload>>(
      "/auth/register",
      input
    );
    return data.data;
  },

  async login(input: LoginInput): Promise<AuthPayload> {
    const { data } = await api.post<ApiResponse<AuthPayload>>(
      "/auth/login",
      input
    );
    return data.data;
  },
};
