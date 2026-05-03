<div align="center">
  <h1>🚀 Team Task Manager</h1>
  <p><strong>A full-stack MERN application for seamless team task management with JWT authentication and role-based access control.</strong></p>
</div>

---

## 🌟 Features

- **🔐 Authentication & Security:** Secure Signup and Login using JSON Web Tokens (JWT).
- **👥 Role-Based Access Control (RBAC):** Admins can manage projects and assign tasks; Team Members can update and track their own assigned tasks.
- **📁 Project Management:** Create, view, organize, and delete team projects effortlessly.
- **📋 Kanban Board:** Intuitive drag-and-drop interface for task management (To Do, In Progress, Review, Done).
- **📊 Dashboard Analytics:** Comprehensive overview with real-time statistics (Total, Completed, Pending, and Overdue tasks).
- **📈 Reporting & Visualization:** Interactive charts and trends to track team productivity and progress over time.

## 🛠️ Tech Stack

### Frontend
- **Framework:** [React 18](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Interactions:** [@dnd-kit](https://dndkit.com/) for robust drag-and-drop functionality
- **State & Data:** [React Query](https://tanstack.com/query/latest) & [Zod](https://zod.dev/) for validation

### Backend
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/) *(Includes fallback to in-memory DB if no local instance is found)*
- **Security:** JWT for Auth & bcrypt for password hashing

---

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:
- **[Node.js](https://nodejs.org/)** (v18 or higher)
- **[Git](https://git-scm.com/)**
- *(Optional)* **[MongoDB](https://www.mongodb.com/try/download/community)** installed locally or a MongoDB Atlas URI. 
  > *Note: If MongoDB is not available, the app will gracefully fall back to an in-memory database so you can start testing immediately.*

---

## 🚀 Getting Started

Follow these steps to get the project up and running locally.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
```

### 2. Start the Backend Server
Open your first terminal and run:
```bash
cd server
npm install
npm run dev
```
> The server will start at `http://localhost:5001`.

### 3. Start the Frontend Application
Open a second terminal (from the project root directory) and run:
```bash
npm install
npm run dev
```
> The application will be available at `http://localhost:8080`. API calls are automatically proxied to the backend.

---

## ⚙️ Environment Variables

To deploy or run production builds with a real database, you'll need to configure your environment variables.

Create a `.env` file in the `server` directory (or use `.env.production.example` as a template):
```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/team_task_manager_db
JWT_SECRET=your_super_secret_key_here
```

---

## 🚢 Deployment (Railway)

This project is pre-configured for easy deployment on platforms like [Railway](https://railway.app/).

1. Connect your GitHub repository to a new Railway project.
2. Set the environment variables (`PORT`, `MONGO_URI`, `JWT_SECRET`) in your Railway service settings.
3. The included `railway.toml` and `nixpacks.toml` files will automatically handle the build process and start the application.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/team-task-manager/issues) if you want to contribute.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
