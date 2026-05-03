# 🚀 Team Task Manager (Full-Stack)

A full-stack web application that allows teams to create projects, assign tasks, and track progress with role-based access control (Admin/Member).

---

## 📌 Features

### 🔐 Authentication
- User Signup & Login  
- Secure authentication using JWT  
- Password hashing with bcrypt  

### 👥 Role-Based Access
- Admin
  - Create & manage projects  
  - Assign tasks to members  
- Member
  - View assigned tasks  
  - Update task status  

### 📁 Project Management
- Create and manage multiple projects  
- Add team members to projects  

### ✅ Task Management
- Create tasks with:
  - Title  
  - Description  
  - Priority (Low/Medium/High)  
  - Due Date  
- Assign tasks to users  
- Update task status:
  - Pending  
  - In Progress  
  - Completed  

### 📊 Dashboard
- View total tasks  
- Track completed & pending tasks  
- Identify overdue tasks  

---

## ⚙️ Tech Stack

- Frontend: React  
- Backend: Node.js + Express  
- Database: MongoDB (NoSQL)  
- Authentication: JWT  

---

## 🗄️ Database Structure

### Users
- name  
- email  
- password  
- role (Admin/Member)  

### Projects
- title  
- description  
- members  

### Tasks
- title  
- description  
- assignedTo  
- projectId  
- status  
- dueDate  

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|---------|------------|
| POST | /api/auth/signup | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/projects | Get all projects |
| POST | /api/projects | Create project |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |

---

## 🌐 Deployment

The application is deployed using Railway.

### 🔗 Live URL  
👉 https://team-task-managerr-ad3hxuh34-adiii001-thkrs-projects.vercel.app/

---

## 🎥 Demo Video  
👉 Watch Demo Video

---

## 📦 Installation & Setup

### 1️⃣ Clone Repository
bash git clone https://github.com/Adiii001-thkr/TeamTaskManagerr.git cd TeamTaskManagerr 

### 2️⃣ Backend Setup
bash cd server npm install npm start 

### 3️⃣ Frontend Setup
bash cd client npm install npm run dev 

---

## 🔐 Environment Variables

Create a .env file in backend:

MONGO_URI=your_mongodb_connection JWT_SECRET=your_secret_key PORT=5000

---

## 📂 GitHub Repository  
👉 https://github.com/Adiii001-thkr/TeamTaskManagerr  

---

## 🎯 Conclusion

This project demonstrates:
- Full-stack development  
- REST API design  
- Role-based authentication  
- Real-world task management system  

---

## 👨‍💻 Author  

Aditya Thakur  
- GitHub: https://github.com/Adiii001-thk
