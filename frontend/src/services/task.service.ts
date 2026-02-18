import api from "./api.ts";
import type {
  ApiResponse,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
} from "../types/index.ts";

export const taskService = {
  async getByProject(projectId: string): Promise<Task[]> {
    const { data } = await api.get<ApiResponse<Task[]>>(
      `/projects/${projectId}/tasks`
    );
    return data.data;
  },

  async create(input: CreateTaskInput): Promise<Task> {
    const { data } = await api.post<ApiResponse<Task>>("/tasks", input);
    return data.data;
  },

  async update(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const { data } = await api.put<ApiResponse<Task>>(
      `/tasks/${taskId}`,
      input
    );
    return data.data;
  },

  async remove(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  },
};
