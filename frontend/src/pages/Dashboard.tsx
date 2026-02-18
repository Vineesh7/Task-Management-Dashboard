import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useProjects } from "../hooks/useProjects.ts";
import { useAuth } from "../hooks/useAuth.ts";
import { Spinner } from "../components/ui/Spinner.tsx";
import { ErrorAlert } from "../components/ui/ErrorAlert.tsx";
import type { Project } from "../types/index.ts";

// ── Create-project form (inline) ─────────────────────────────────────────
function CreateProjectForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const { addProject } = useProjects();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await addProject({ name: name.trim(), description: description.trim() || undefined });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-lg border border-indigo-200 bg-indigo-50/50 p-5"
    >
      <h2 className="mb-4 text-sm font-semibold text-indigo-900">
        New Project
      </h2>

      {error && (
        <div className="mb-3">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="proj-name" className="mb-1 block text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="proj-name"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. Sprint 1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="proj-desc" className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="proj-desc"
          placeholder="Brief description (optional)"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Project"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Project card ──────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const { taskCounts } = project;

  // Progress bar width (avoid division by zero)
  const pct = taskCounts.total > 0
    ? Math.round((taskCounts.done / taskCounts.total) * 100)
    : 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      {/* ── Name + description ──────────────────────────────────── */}
      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
        {project.name}
      </h2>
      {project.description && (
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* ── Spacer pushes stats to bottom ───────────────────────── */}
      <div className="mt-auto pt-4">
        {/* ── Status pills ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-600">
            {taskCounts.todo} To Do
          </span>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-700">
            {taskCounts.inProgress} In Progress
          </span>
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-green-700">
            {taskCounts.done} Done
          </span>
        </div>

        {/* ── Progress bar ──────────────────────────────────────── */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>{taskCounts.total} tasks</span>
            <span>{pct}% complete</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16">
      {/* Folder icon */}
      <svg
        className="mb-4 h-12 w-12 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
      <h3 className="text-sm font-semibold text-gray-900">No projects yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Create your first project to start tracking tasks.
      </p>
      <button
        onClick={onCreateClick}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        New Project
      </button>
    </div>
  );
}

// ── Main Dashboard page ───────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const { projects, isLoading, error, fetchProjects } = useProjects();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div>
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.name}. You have{" "}
            {projects.length} project{projects.length !== 1 ? "s" : ""}.
          </p>
        </div>

        {!showForm && projects.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 self-start rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:self-auto"
          >
            {/* Plus icon */}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        )}
      </div>

      {/* ── Summary bar (only when there are projects) ─────────────── */}
      {!isLoading && projects.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Projects",
              value: projects.length,
              color: "text-gray-900",
              bg: "bg-white",
            },
            {
              label: "To Do",
              value: projects.reduce((s, p) => s + p.taskCounts.todo, 0),
              color: "text-gray-700",
              bg: "bg-white",
            },
            {
              label: "In Progress",
              value: projects.reduce((s, p) => s + p.taskCounts.inProgress, 0),
              color: "text-blue-700",
              bg: "bg-white",
            },
            {
              label: "Done",
              value: projects.reduce((s, p) => s + p.taskCounts.done, 0),
              color: "text-green-700",
              bg: "bg-white",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-lg border border-gray-200 ${stat.bg} px-4 py-3 shadow-sm`}
            >
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Create form ────────────────────────────────────────────── */}
      {showForm && (
        <CreateProjectForm
          onCreated={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ── Loading state ──────────────────────────────────────────── */}
      {isLoading && <Spinner />}

      {/* ── Error state ────────────────────────────────────────────── */}
      {!isLoading && error && <ErrorAlert message={error} />}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!isLoading && !error && projects.length === 0 && (
        <EmptyState onCreateClick={() => setShowForm(true)} />
      )}

      {/* ── Project grid ───────────────────────────────────────────── */}
      {!isLoading && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
