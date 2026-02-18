import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import { useTasks } from "../hooks/useTasks.ts";
import { useFormValidation } from "../hooks/useFormValidation.ts";
import { ErrorAlert } from "./ui/ErrorAlert.tsx";
import type { Task, TaskStatus, TaskPriority } from "../types/index.ts";

// ── Types ─────────────────────────────────────────────────────────────────
interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

interface TaskModalProps {
  projectId: string;
  task?: Task;            // if provided → edit mode, otherwise → create mode
  defaultStatus?: TaskStatus;
  onClose: () => void;
}

// ── Validation ────────────────────────────────────────────────────────────
const validateTask = (values: TaskFormValues) => {
  const errors: Partial<Record<keyof TaskFormValues, string>> = {};

  if (!values.title.trim()) {
    errors.title = "Title is required";
  } else if (values.title.length > 200) {
    errors.title = "Title cannot exceed 200 characters";
  }

  if (values.description.length > 1000) {
    errors.description = "Description cannot exceed 1000 characters";
  }

  return errors;
};

// ── Constants ─────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; dot: string }[] = [
  { value: "LOW", label: "Low", dot: "bg-gray-400" },
  { value: "MEDIUM", label: "Medium", dot: "bg-yellow-400" },
  { value: "HIGH", label: "High", dot: "bg-red-400" },
];

// ── Helper ────────────────────────────────────────────────────────────────
/** Convert ISO date string to YYYY-MM-DD for input[type=date] */
function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ── Component ─────────────────────────────────────────────────────────────
export function TaskModal({
  projectId,
  task,
  defaultStatus,
  onClose,
}: TaskModalProps) {
  const isEdit = !!task;
  const { addTask, editTask, removeTask } = useTasks();
  const backdropRef = useRef<HTMLDivElement>(null);

  // ── Form state ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(
    task?.status ?? defaultStatus ?? "TODO"
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "MEDIUM"
  );
  const [dueDate, setDueDate] = useState(toDateInputValue(task?.dueDate));

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { errors, validate, clearField } = useFormValidation(validateTask);

  // ── Close on Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Close on backdrop click ─────────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose]
  );

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setServerError(null);

      const values: TaskFormValues = { title, description, status, priority, dueDate };
      if (!validate(values)) return;

      setIsSubmitting(true);
      try {
        if (isEdit && task) {
          await editTask(task.id, {
            title: title.trim(),
            description: description.trim() || null,
            status,
            priority,
            dueDate: dueDate || null,
          });
        } else {
          await addTask({
            title: title.trim(),
            description: description.trim() || undefined,
            status,
            priority,
            projectId,
            dueDate: dueDate || undefined,
          });
        }
        onClose();
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      title, description, status, priority, dueDate,
      isEdit, task, projectId, validate, addTask, editTask, onClose,
    ]
  );

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await removeTask(task.id);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [task, removeTask, onClose]);

  // ── Shared input classes ────────────────────────────────────────────────
  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const inputErrorClass =
    "w-full rounded-md border border-red-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

  return (
    // ── Backdrop ──────────────────────────────────────────────────────────
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      {/* ── Modal panel ──────────────────────────────────────────────────── */}
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="task-modal-title" className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
          {serverError && <ErrorAlert message={serverError} />}

          {/* Title */}
          <div>
            <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              placeholder="What needs to be done?"
              maxLength={200}
              value={title}
              onChange={(e) => { setTitle(e.target.value); clearField("title"); }}
              className={errors.title ? inputErrorClass : inputClass}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "task-title-error" : undefined}
              autoFocus
            />
            {errors.title && <p id="task-title-error" className="mt-1 text-sm text-red-600" role="alert">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="task-desc"
              placeholder="Add details..."
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => { setDescription(e.target.value); clearField("description"); }}
              className={errors.description ? inputErrorClass : inputClass}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "task-desc-error" : undefined}
            />
            {errors.description && (
              <p id="task-desc-error" className="mt-1 text-sm text-red-600" role="alert">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">{description.length}/1000</p>
          </div>

          {/* Status + Priority — side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label htmlFor="task-status" className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Priority
              </label>
              <div className="flex gap-1">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    aria-pressed={priority === opt.value}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition ${
                      priority === opt.value
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label htmlFor="task-due" className="mb-1 block text-sm font-medium text-gray-700">
              Due date
            </label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            {/* Delete (edit mode only) */}
            <div>
              {isEdit && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              )}
              {isEdit && showDeleteConfirm && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Are you sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Save / Cancel */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isEdit ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
