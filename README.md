# Task Management Dashboard

A full-stack Kanban-style task management application built with TypeScript across the entire stack. Users can register, create projects, and manage tasks through an interactive drag-and-drop board.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Assumptions](#assumptions)
- [Future Improvements](#future-improvements)

## Tech Stack

| Layer          | Technology                                                   |
| -------------- | ------------------------------------------------------------ |
| **Frontend**   | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7 |
| **Backend**    | Node.js, Express, TypeScript                                 |
| **Database**   | PostgreSQL with Prisma ORM                                   |
| **Auth**       | JWT (jsonwebtoken) + bcrypt password hashing                 |
| **Security**   | CORS origin restriction, request body size limits, email normalization |
| **Validation** | Zod (backend), custom validation hooks (frontend)            |
| **DnD**        | @hello-pangea/dnd (maintained fork of react-beautiful-dnd)   |
| **Testing**    | Jest + ts-jest (backend unit tests)                          |
| **HTTP**       | Axios with request/response interceptors                     |

## Architecture

### Backend — Layered Architecture

The backend follows a **Controller → Service → Repository** pattern with clear separation of concerns:

```
HTTP Request
  │
  ├─ Route ──→ validate(zodSchema)   Zod middleware rejects bad input with 400
  │                │
  ├─ Middleware ──→ authenticate()    JWT verification, attaches req.user
  │                │
  ├─ Controller                       Parses request, formats HTTP response
  │    │
  ├─ Service                          Business logic, authorization checks
  │    │
  ├─ Repository                       Prisma queries only — no logic
  │    │
  └─ Database                         PostgreSQL
```

**Why three layers?**

- **Controllers** never contain business logic — they translate HTTP to function calls and back.
- **Services** enforce authorization ("does this user own this project?") and orchestrate operations. They are unit-testable with mocked repositories.
- **Repositories** are the only layer that knows about Prisma. If the ORM changes, only repositories are affected.

**Server / App separation** — `app.ts` exports the Express application without calling `listen()`, while `server.ts` is the entry point that starts the HTTP server. This allows the app to be imported directly by test frameworks like supertest without binding to a port.

### Frontend — Context + Services

```
Pages ──→ Custom Hooks ──→ Context Providers ──→ Service Layer ──→ Axios ──→ API
                              (state mgmt)        (pure async)     (JWT interceptor)
```

- **Context API** manages three state slices: Auth, Projects, Tasks.
- **Service layer** contains pure async functions that call the API and return typed data. No React dependencies — fully testable in isolation.
- **Axios interceptors** handle JWT attachment (request) and 401 auto-logout (response).
- **Accessibility** — Skip-to-content link, ARIA attributes on modals (`role="dialog"`, `aria-modal`, `aria-labelledby`), `aria-invalid`/`aria-describedby` on form inputs, `aria-pressed` on toggle buttons, `aria-hidden` on decorative icons, and keyboard-accessible task cards.

## Project Structure

```
task-dashboard/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma              # Database models + indexes
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts            # Prisma client singleton
│   │   │   └── env.ts                 # Zod-validated environment variables
│   │   ├── middleware/
│   │   │   ├── auth.ts                # JWT verification middleware
│   │   │   ├── error-handler.ts       # Global error handler
│   │   │   └── validate.ts            # Zod validation middleware
│   │   ├── modules/
│   │   │   ├── auth/                  # Register, login, JWT generation
│   │   │   ├── project/               # CRUD + per-status task counts
│   │   │   └── task/                  # CRUD + ownership verification
│   │   ├── utils/
│   │   │   ├── app-error.ts           # Custom error class (400–409)
│   │   │   ├── async-handler.ts       # Async route wrapper
│   │   │   └── response.ts            # Consistent JSON helpers
│   │   ├── app.ts                     # Express setup + route mounting
│   │   └── server.ts                  # Entry point — starts HTTP server
│   └── tests/                         # Unit tests (14 tests, 3 suites)
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/                    # Spinner, ErrorAlert, FormInput
│       │   ├── GuestRoute.tsx         # Redirects authed users away from login
│       │   ├── ProtectedRoute.tsx     # Redirects guests to login
│       │   ├── Layout.tsx             # Navbar + page outlet
│       │   ├── KanbanColumn.tsx       # Droppable column
│       │   ├── TaskCard.tsx           # Draggable task card
│       │   └── TaskModal.tsx          # Create/edit task modal
│       ├── context/                   # AuthContext, ProjectContext, TaskContext
│       ├── hooks/                     # useAuth, useProjects, useTasks, useFormValidation
│       ├── pages/                     # Login, Register, Dashboard, ProjectView
│       ├── services/                  # api.ts (Axios), auth/project/task services
│       └── types/                     # Shared TypeScript interfaces
│
└── README.md
```

## Database Schema

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    users      │       │    projects       │       │      tasks       │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id       UUID│ PK    │ id        UUID   │ PK    │ id       UUID   │ PK
│ email  UNIQUE│       │ name      VARCHAR│       │ title    VARCHAR│
│ password     │       │ description TEXT │       │ description TEXT│
│ name   VARCHAR│       │ owner_id  UUID  │ FK→   │ status   ENUM  │
│ created_at   │       │ created_at      │       │ priority ENUM  │
└──────────────┘       └──────────────────┘       │ position INT   │
                                                   │ project_id UUID│ FK→
                                                   │ assignee_id UUID FK→
                                                   │ due_date  DATE │
                                                   │ created_at     │
                                                   │ updated_at     │
                                                   └──────────────────┘

Enums:
  TaskStatus:   TODO | IN_PROGRESS | DONE
  TaskPriority: LOW  | MEDIUM      | HIGH

Indexes:
  idx_project_owner_created   (owner_id, created_at DESC)
  idx_task_project_status_pos (project_id, status, position)
  idx_task_project            (project_id)
  idx_task_assignee           (assignee_id)
  idx_task_due_date           (due_date)
```

## API Endpoints

| Method | Endpoint                  | Auth | Description                           |
| ------ | ------------------------- | ---- | ------------------------------------- |
| POST   | `/api/auth/register`      | No   | Create account, returns JWT           |
| POST   | `/api/auth/login`         | No   | Login, returns JWT                    |
| GET    | `/api/projects`           | Yes  | List user's projects with task counts |
| POST   | `/api/projects`           | Yes  | Create a project                      |
| GET    | `/api/projects/:id/tasks` | Yes  | Get all tasks for a project           |
| POST   | `/api/tasks`              | Yes  | Create a task                         |
| PUT    | `/api/tasks/:id`          | Yes  | Update a task (status, position, etc) |
| DELETE | `/api/tasks/:id`          | Yes  | Delete a task (returns 204)           |

All endpoints return JSON in the format `{ success: boolean, data: T }`.
Errors return `{ success: false, error: string }`.

## Getting Started

### Prerequisites

- **Node.js** >= 20.19.x (or >= 22.12.x)
- **PostgreSQL** >= 14
- **npm** >= 9.x

### 1. Clone the repository

```bash
git clone <repository-url>
cd task-dashboard
```

### 2. Set up the database

Create a PostgreSQL database:

```bash
psql -U postgres -c "CREATE DATABASE task_dashboard;"
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your actual database credentials (see [Environment Variables](#environment-variables)).

### 4. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Run database migrations

```bash
cd backend
npx prisma migrate dev --name init
```

This creates all tables, indexes, and enums in your PostgreSQL database.

## Environment Variables

Create a `backend/.env` file with the following variables:

| Variable         | Description                  | Example                                                                      |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `PORT`           | Server port                  | `3000`                                                                       |
| `NODE_ENV`       | Environment                  | `development`                                                                |
| `DATABASE_URL`   | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/task_dashboard?schema=public` |
| `JWT_SECRET`     | Secret key for signing JWTs  | A random string, at least 32 characters                                      |
| `JWT_EXPIRES_IN` | Token expiry duration        | `7d`                                                                         |
| `FRONTEND_URL`   | Allowed CORS origin (prod)   | `https://your-frontend.com`                                                  |

The frontend does not require a `.env` file. In development, Vite proxies `/api` requests to `http://localhost:3000` and CORS is configured to allow `http://localhost:5173`.

## Running Locally

Open two terminal windows:

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

The API server starts at `http://localhost:3000`.

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

The React app starts at `http://localhost:5173` and proxies API calls to the backend.

### Verify it works

1. Open `http://localhost:5173` in your browser.
2. Register a new account.
3. Create a project from the dashboard.
4. Click into the project and add tasks.
5. Drag tasks between columns.

## Running Tests

The backend has 14 unit tests across 3 test suites:

```bash
cd backend
npm test
```

```
PASS tests/auth.service.test.ts      (5 tests)
PASS tests/project.service.test.ts   (4 tests)
PASS tests/task.service.test.ts      (5 tests)

Test Suites: 3 passed, 3 total
Tests:       14 passed, 14 total
```

Tests use **mocked repositories** — no database connection required.

### What's tested

| Suite           | Covers                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Auth Service    | Registration hashes passwords, login verifies credentials, duplicate email rejection, JWT generation |
| Project Service | Project creation with correct owner, ownership gate (403/404)                                        |
| Task Service    | Task creation with ownership check, status updates, forbidden access, not-found handling             |

## Deployment

### Backend

1. Build the TypeScript:

```bash
cd backend
npm run build
```

2. Set production environment variables (especially `NODE_ENV=production`, a strong `JWT_SECRET`, and `FRONTEND_URL` for CORS).

3. Run database migrations against the production database:

```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

4. Start the server:

```bash
npm start
```

### Frontend

1. Build the production bundle:

```bash
cd frontend
npm run build
```

2. The output is in `frontend/dist/`. Serve it with any static file server (Nginx, Caddy, Vercel, Netlify).

3. Configure the static server to:
   - Proxy `/api/*` requests to the backend.
   - Serve `index.html` for all other routes (SPA fallback).

### Docker (optional)

Both services can be containerized. A typical setup would use:

- A `Dockerfile` for the backend (Node.js alpine image).
- A multi-stage `Dockerfile` for the frontend (build with Node.js, serve with Nginx).
- `docker-compose.yml` to orchestrate backend, frontend, and PostgreSQL.

## Assumptions

1. **Single-user projects** — Each project has one owner. There is no team/collaboration model. The `assigneeId` field on tasks exists for future expansion but there is no UI to manage team members.

2. **No refresh tokens** — The JWT has a 7-day expiry. On expiration, the user must log in again. A production system would use short-lived access tokens with a refresh token rotation flow.

3. **No pagination** — Project and task lists are returned in full. This works for the expected scale (tens of projects, hundreds of tasks per project) but would need cursor-based pagination at larger scale.

4. **Position is per-column** — Task `position` is an integer used for ordering within a Kanban column. When a task is moved, only the moved task's position is updated on the server. Full reorder persistence (updating all affected tasks' positions in a transaction) is a future improvement.

5. **PostgreSQL is available locally** — The setup instructions assume a local PostgreSQL instance. The app could be adapted to use Docker for the database with minimal changes.

6. **No file uploads or rich text** — Task descriptions are plain text.

## Future Improvements

- **Drag-and-drop reorder persistence** — Batch-update all affected task positions in a single transaction when a task is moved, rather than only updating the moved task.
- **Real-time updates** — Add WebSocket support (Socket.io) so multiple users see board changes instantly.
- **Team collaboration** — Add a `project_members` join table, invite flow, and role-based permissions (admin/member/viewer).
- **Task comments** — A `comments` table linked to tasks, with real-time updates.
- **Search and filtering** — Full-text search across tasks, filter by assignee/priority/due date.
- **Pagination** — Cursor-based pagination for projects and tasks at scale.
- **Refresh token rotation** — Short-lived access tokens (15 min) with HTTP-only refresh token cookies.
- **CI/CD pipeline** — GitHub Actions for lint, test, build, and deploy on push to main.
- **E2E tests** — Playwright or Cypress tests covering the full login → create project → manage tasks flow.
- **Dark mode** — Tailwind's `dark:` variant is already available; needs a theme toggle and preference persistence.
