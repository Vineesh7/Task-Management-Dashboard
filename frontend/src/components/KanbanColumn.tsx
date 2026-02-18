import { Droppable } from "@hello-pangea/dnd";
import { TaskCard } from "./TaskCard.tsx";
import type { Task, TaskStatus } from "../types/index.ts";

const COLUMN_META: Record<
  TaskStatus,
  { label: string; bg: string; dot: string }
> = {
  TODO: { label: "To Do", bg: "bg-gray-50", dot: "bg-gray-400" },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50",
    dot: "bg-blue-400",
  },
  DONE: { label: "Done", bg: "bg-green-50", dot: "bg-green-400" },
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const meta = COLUMN_META[status];

  return (
    <div className={`flex flex-col rounded-xl ${meta.bg} p-3`}>
      {/* ── Column header ────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
        <h3 className="text-sm font-semibold text-gray-700">{meta.label}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500 shadow-sm">
          {tasks.length}
        </span>
        {/* Add task button */}
        <button
          onClick={() => onAddTask(status)}
          className="ml-auto rounded-md p-1 text-gray-400 hover:bg-white hover:text-gray-600"
          title={`Add task to ${meta.label}`}
          aria-label={`Add task to ${meta.label}`}
        >
          <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* ── Droppable zone ───────────────────────────────────────── */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg p-1 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-indigo-50 ring-2 ring-inset ring-indigo-200"
                : ""
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}

            {/* ── Empty column message ────────────────────────────── */}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-xs text-gray-400">Drop tasks here</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
