import {
  createContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { projectService } from "../services/project.service.ts";
import type { Project, CreateProjectInput } from "../types/index.ts";

// ── Context shape ─────────────────────────────────────────────────────────
interface ProjectContextValue {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  addProject: (input: CreateProjectInput) => Promise<Project>;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────
export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addProject = useCallback(async (input: CreateProjectInput) => {
    const created = await projectService.create(input);
    setProjects((prev) => [created, ...prev]);
    return created;
  }, []);

  return (
    <ProjectContext.Provider
      value={{ projects, isLoading, error, fetchProjects, addProject }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
