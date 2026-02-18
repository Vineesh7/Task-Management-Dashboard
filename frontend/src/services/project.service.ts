import api from "./api.ts";
import type {
  ApiResponse,
  Project,
  CreateProjectInput,
} from "../types/index.ts";

export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data } = await api.get<ApiResponse<Project[]>>("/projects");
    return data.data;
  },

  async getById(id: string): Promise<Project> {
    const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return data.data;
  },

  async create(input: CreateProjectInput): Promise<Project> {
    const { data } = await api.post<ApiResponse<Project>>("/projects", input);
    return data.data;
  },
};
