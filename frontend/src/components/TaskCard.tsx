import { Draggable } from "@hello-pangea/dnd";
import type { Task } from "../types/index.ts";

const PRIORITY_STYLES = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-gray-100 text-gray-600",
} as const;

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isOverdue =
    task.dueDate &&
    task.status !== "DONE" &&
    new Date(task.dueDate) < new Date();

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(task); } }}
          role="button"
          tabIndex={0}
          aria-label={`Task: ${task.title}`}
          className={`cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition select-none ${
            snapshot.isDragging
              ? "border-indigo-300 shadow-lg ring-2 ring-indigo-200"
              : "border-gray-200 hover:border-indigo-200 hover:shadow"
          }`}
        >
          {/* ── Title ──────────────────────────────────────────────── */}
          <p className="text-sm font-medium text-gray-900 leading-snug">
            {task.title}
          </p>

          {/* ── Description ────────────────────────────────────────── */}
          {task.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* ── Metadata row ───────────────────────────────────────── */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {/* Priority pill */}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority}
            </span>

            {/* Due date */}
            {dueLabel && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  isOverdue ? "font-medium text-red-600" : "text-gray-400"
                }`}
              >
                <svg
                  className="h-3 w-3"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {dueLabel}
              </span>
            )}

            {/* Assignee */}
            {task.assignee && (
              <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                <svg
                  className="h-3 w-3"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {task.assignee.name}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
