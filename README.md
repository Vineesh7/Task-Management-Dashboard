# Task Management Dashboard

**[Live Demo](https://task-management-dashboard-inky-nine.vercel.app)**

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

Make sure you have the following installed on your machine:

- **Node.js** >= 20 — [Download](https://nodejs.org/)
- **PostgreSQL** >= 14 — [Download](https://www.postgresql.org/download/)
- **npm** >= 9 (comes with Node.js)

Verify your installations:

```bash
node -v    # should print v20.x.x or higher
npm -v     # should print 9.x.x or higher
psql -V    # should print psql (PostgreSQL) 14.x or higher
```

### Quick Start (copy-paste friendly)

```bash
# 1. Clone the repo
git clone https://github.com/Vineesh7/Task-Management-Dashboard.git
cd Task-Management-Dashboard

# 2. Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE task_dashboard;"

# 3. Set up backend environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL credentials if they differ from the defaults

# 4. Install dependencies for both backend and frontend
cd backend && npm install && cd ../frontend && npm install && cd ..

# 5. Generate Prisma client and run database migrations
cd backend
npx prisma generate
npx prisma migrate dev --name init

# 6. Start the backend (keep this terminal open)
npm run dev
```

Open a **second terminal**:

```bash
# 7. Start the frontend
cd frontend
npm run dev
```

The app is now running:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000

> The frontend automatically proxies `/api` requests to the backend — no extra configuration needed.

### Verify it works

1. Open http://localhost:5173 in your browser
2. Register a new account
3. Create a project from the dashboard
4. Click into the project and add tasks
5. Drag tasks between columns to change their status

## Environment Variables

Create a `backend/.env` file (or copy from the example):

```bash
cp backend/.env.example backend/.env
```

| Variable         | Description                  | Default / Example                                                            |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `PORT`           | Server port                  | `3000`                                                                       |
| `NODE_ENV`       | Environment                  | `development`                                                                |
| `DATABASE_URL`   | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/task_dashboard?schema=public` |
| `JWT_SECRET`     | Secret key for signing JWTs  | Any random string, at least 10 characters                                    |
| `JWT_EXPIRES_IN` | Token expiry duration        | `7d`                                                                         |
| `FRONTEND_URL`   | Allowed CORS origin (prod only) | Not needed locally                                                        |

**Defaults work out of the box** if your local PostgreSQL runs on port `5432` with user `postgres` and password `postgres`. If your credentials differ, update the `DATABASE_URL` in `backend/.env`.

The frontend does **not** require a `.env` file. In development, Vite proxies `/api` requests to `http://localhost:3000` automatically.

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

The application is deployed and accessible at:

| Service      | Platform | URL                                                                                          |
| ------------ | -------- | -------------------------------------------------------------------------------------------- |
| **Frontend** | Vercel   | [task-management-dashboard-inky-nine.vercel.app](https://task-management-dashboard-inky-nine.vercel.app) |
| **Backend**  | Render   | [task-management-dashboard-dsv4.onrender.com](https://task-management-dashboard-dsv4.onrender.com)       |
| **Database** | Render   | PostgreSQL (managed by Render)                                                               |

> **Note:** The Render free tier spins down after inactivity. The first request may take 30–60 seconds while the backend cold-starts.

### How it works

- **Vercel** builds and serves the React frontend from `frontend/`.
- API requests (`/api/*`) are proxied to the Render backend via Vercel rewrites configured in `frontend/vercel.json`.
- **Render** runs the Express backend with `npm start` (compiled TypeScript) and hosts the PostgreSQL database.
- All non-API routes fall back to `index.html` for client-side routing (SPA fallback).

### Environment variables on Render

| Variable       | Value                                    |
| -------------- | ---------------------------------------- |
| `NODE_ENV`     | `production`                             |
| `DATABASE_URL` | Provided by Render PostgreSQL add-on     |
| `JWT_SECRET`   | A strong random string (32+ characters)  |
| `JWT_EXPIRES_IN` | `7d`                                   |

### Deploy your own

#### Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com) connected to your GitHub repo.
2. Set the **Root Directory** to `backend`.
3. Set **Build Command** to `npm install && npx prisma generate && npm run build`.
4. Set **Start Command** to `npm start`.
5. Add a **PostgreSQL** database and link the `DATABASE_URL` env var.
6. Add `JWT_SECRET`, `JWT_EXPIRES_IN`, and `NODE_ENV=production` as environment variables.
7. Run `npx prisma migrate deploy` from the Render shell to create tables.

#### Frontend (Vercel)

1. Import the GitHub repo on [Vercel](https://vercel.com).
2. Set the **Root Directory** to `frontend`.
3. Framework preset will auto-detect **Vite** — no extra config needed.
4. Update `frontend/vercel.json` to point the API rewrite to your Render backend URL.
5. Deploy.

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
