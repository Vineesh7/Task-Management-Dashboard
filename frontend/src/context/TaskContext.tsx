import {
  createContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { taskService } from "../services/task.service.ts";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
} from "../types/index.ts";

// ── Context shape ─────────────────────────────────────────────────────────
interface TaskContextValue {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: (projectId: string) => Promise<void>;
  addTask: (input: CreateTaskInput) => Promise<Task>;
  editTask: (taskId: string, input: UpdateTaskInput) => Promise<Task>;
  removeTask: (taskId: string) => Promise<void>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const TaskContext = createContext<TaskContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskService.getByProject(projectId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTask = useCallback(async (input: CreateTaskInput) => {
    const created = await taskService.create(input);
    setTasks((prev) => [...prev, created]);
    return created;
  }, []);

  const editTask = useCallback(async (taskId: string, input: UpdateTaskInput) => {
    const updated = await taskService.update(taskId, input);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? updated : t))
    );
    return updated;
  }, []);

  const removeTask = useCallback(async (taskId: string) => {
    await taskService.remove(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        fetchTasks,
        addTask,
        editTask,
        removeTask,
        setTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}
