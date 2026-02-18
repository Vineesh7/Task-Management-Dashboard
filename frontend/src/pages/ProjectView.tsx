import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DragDropContext,
  type DropResult,
} from "@hello-pangea/dnd";
import { useTasks } from "../hooks/useTasks.ts";
import { taskService } from "../services/task.service.ts";
import { projectService } from "../services/project.service.ts";
import { KanbanColumn } from "../components/KanbanColumn.tsx";
import { TaskModal } from "../components/TaskModal.tsx";
import { Spinner } from "../components/ui/Spinner.tsx";
import { ErrorAlert } from "../components/ui/ErrorAlert.tsx";
import type { Task, TaskStatus, Project } from "../types/index.ts";

// Column render order
const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

/** Group tasks by status, preserving position order within each column. */
function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = {
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  for (const key of COLUMNS) {
    grouped[key].sort((a, b) => a.position - b.position);
  }

  return grouped;
}

// ── Modal state ───────────────────────────────────────────────────────────
type ModalState =
  | { mode: "closed" }
  | { mode: "create"; defaultStatus: TaskStatus }
  | { mode: "edit"; task: Task };

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const { tasks, isLoading, error, fetchTasks, setTasks } = useTasks();

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [dropError, setDropError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  // ── Fetch project metadata + tasks in parallel ──────────────────────────
  useEffect(() => {
    if (!id) return;

    setProjectLoading(true);
    setDropError(null);

    Promise.all([
      projectService.getById(id).then(setProject),
      fetchTasks(id),
    ]).finally(() => setProjectLoading(false));
  }, [id, fetchTasks]);

  // ── Modal handlers ──────────────────────────────────────────────────────
  const openCreateModal = useCallback((status: TaskStatus) => {
    setModal({ mode: "create", defaultStatus: status });
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setModal({ mode: "edit", task });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ mode: "closed" });
  }, []);

  // ── Drag end handler ────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;

      if (
        !destination ||
        (source.droppableId === destination.droppableId &&
          source.index === destination.index)
      ) {
        return;
      }

      const sourceStatus = source.droppableId as TaskStatus;
      const destStatus = destination.droppableId as TaskStatus;

      // ── Optimistic update ───────────────────────────────────────────
      const prev = [...tasks];
      const grouped = groupByStatus([...tasks]);

      const [movedTask] = grouped[sourceStatus].splice(source.index, 1);
      const updatedTask: Task = {
        ...movedTask,
        status: destStatus,
        position: destination.index,
      };
      grouped[destStatus].splice(destination.index, 0, updatedTask);

      grouped[destStatus] = grouped[destStatus].map((t, i) => ({
        ...t,
        position: i,
      }));

      if (sourceStatus !== destStatus) {
        grouped[sourceStatus] = grouped[sourceStatus].map((t, i) => ({
          ...t,
          position: i,
        }));
      }

      const nextTasks = COLUMNS.flatMap((col) => grouped[col]);
      setTasks(nextTasks);
      setDropError(null);

      // ── Persist ─────────────────────────────────────────────────────
      try {
        await taskService.update(draggableId, {
          status: destStatus,
          position: destination.index,
        });
      } catch (err) {
        setTasks(prev);
        setDropError(
          err instanceof Error ? err.message : "Failed to move task"
        );
      }
    },
    [tasks, setTasks]
  );

  // ── Loading state ───────────────────────────────────────────────────────
  if (projectLoading || isLoading) return <Spinner />;

  // ── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-500">
          &larr; Back to projects
        </Link>
        <ErrorAlert message={error} />
      </div>
    );
  }

  const grouped = groupByStatus(tasks);
  const totalTasks = tasks.length;
  const doneTasks = grouped.DONE.length;

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/dashboard"
            className="mb-2 inline-block text-sm text-indigo-600 hover:text-indigo-500"
          >
            &larr; Back to projects
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {project?.name ?? "Project"}
          </h1>
          {project?.description && (
            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4 self-start sm:self-auto">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{doneTasks}</p>
              <p className="text-xs text-gray-500">Done</p>
            </div>
            {totalTasks > 0 && (
              <>
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">
                    {Math.round((doneTasks / totalTasks) * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">Complete</p>
                </div>
              </>
            )}
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Add task button */}
          <button
            onClick={() => openCreateModal("TODO")}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* ── Drop error ────────────────────────────────────────────────── */}
      {dropError && (
        <div className="mb-4">
          <ErrorAlert message={dropError} />
        </div>
      )}

      {/* ── Kanban board ──────────────────────────────────────────────── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={grouped[status]}
              onTaskClick={openEditModal}
              onAddTask={openCreateModal}
            />
          ))}
        </div>
      </DragDropContext>

      {/* ── Empty board ───────────────────────────────────────────────── */}
      {totalTasks === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12">
          <svg
            className="mb-3 h-10 w-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm font-medium text-gray-900">No tasks yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create your first task to get started.
          </p>
          <button
            onClick={() => openCreateModal("TODO")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      )}

      {/* ── Task Modal ────────────────────────────────────────────────── */}
      {modal.mode === "create" && id && (
        <TaskModal
          projectId={id}
          defaultStatus={modal.defaultStatus}
          onClose={closeModal}
        />
      )}
      {modal.mode === "edit" && id && (
        <TaskModal
          projectId={id}
          task={modal.task}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
