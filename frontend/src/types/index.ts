// ── API envelope ──────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: { field: string; message: string }[];
}

// ── Auth ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

// ── Project ───────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  _count: {
    tasks: number;
  };
  taskCounts: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

// ── Task ──────────────────────────────────────────────────────────────────
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  assignee: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  position?: number;
  assigneeId?: string | null;
  dueDate?: string | null;
}
