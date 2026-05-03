# Team Task Manager — Team Task Manager

A full-stack MERN application for team task management with JWT auth and role-based access control.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [VS Code](https://code.visualstudio.com/)
- MongoDB (optional — app uses in-memory DB if MongoDB is not installed)

## How to Run

### Terminal 1 — Backend Server

```bash
cd server
npm install
npm run dev
```

Server starts at `http://localhost:5001`. If local MongoDB is not running, an in-memory database is used automatically.

### Terminal 2 — Frontend

```bash
npm install
npm run dev
```

Frontend starts at `http://localhost:8080`. API calls are proxied to the backend automatically.

## For Production / Railway Deployment

Set these environment variables:

| Variable     | Example                                       |
|-------------|-----------------------------------------------|
| `PORT`      | `5001`                                         |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/team_task_manager_db` |
| `JWT_SECRET`| `your_super_secret_key`                        |

## Features

- **Authentication** — Signup / Login with JWT
- **Role-Based Access** — Admin can create projects & assign tasks; Members can update their own tasks
- **Projects** — Create, view, delete
- **Tasks** — Create, assign, drag-to-update status (Kanban board)
- **Dashboard** — Stats overview (total, completed, pending, overdue)
- **Reports** — Charts and trends
# Team-Task-Manager-
# Team-Task-Manager-
# Team-Task-Manager
# Team-Task-Manager
# TeamTaskManager
# TeamTaskManager-
# TeamTaskManager
