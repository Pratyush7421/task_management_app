# TaskMaster Pro

A full-stack MERN task management application with role-based access control (RBAC), JWT authentication, and a modern React frontend.

---

## 🏗️ Project Structure

```
taskmaster-pro/
├── backend/                    ← Node.js + Express API server
│   ├── server.js               ← Entry point (starts on port 5000)
│   ├── .env                    ← Environment variables
│   ├── package.json
│   └── src/
│       ├── config/
│       │   └── database.js     ← MongoDB connection
│       ├── models/
│       │   ├── User.js         ← User schema (name, email, password, role)
│       │   └── Task.js         ← Task schema (title, status, priority, dueDate)
│       ├── controllers/
│       │   ├── auth.controller.js    ← register, login, getProfile
│       │   ├── task.controller.js    ← CRUD + stats + filters
│       │   └── admin.controller.js   ← user management, system stats
│       ├── routes/
│       │   ├── auth.routes.js        ← /api/v1/auth/*
│       │   ├── task.routes.js        ← /api/v1/tasks/*
│       │   └── admin.routes.js       ← /api/v1/admin/*
│       └── middleware/
│           ├── auth.middleware.js    ← JWT verification
│           ├── role.middleware.js    ← Role-based access (admin/manager/user)
│           └── error.middleware.js   ← Global error handler
│
└── frontend/                   ← React + Vite app (runs on port 5173)
    ├── index.html              ← HTML shell
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx            ← React entry point
        ├── App.jsx             ← Routes setup
        ├── App.css             ← Global styles
        ├── api/
        │   └── axios.js        ← Axios instance (baseURL + token interceptor)
        ├── context/
        │   └── AuthContext.jsx ← Global auth state
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   └── TaskForm.jsx
        └── pages/
            ├── Home.jsx        ← Landing page (/)
            ├── Login.jsx       ← (/login)
            ├── Register.jsx    ← (/register)
            ├── Dashboard.jsx   ← (/dashboard) - protected
            └── AdminPanel.jsx  ← (/admin) - admin only
```

---

## 🔄 Complete Request-Response Workflow

### Overview

```
Browser (localhost:5173)
        │
        │  User opens app
        ▼
   React App (Vite)
        │
        │  API call via axios
        ▼
   axios.js interceptor
   (adds Authorization: Bearer <token>)
        │
        │  HTTP Request
        ▼
   Express Server (localhost:5000)
        │
        │  Route matching
        ▼
   auth.middleware.js
   (verifies JWT token)
        │
        │  req.user = { userId, role }
        ▼
   role.middleware.js (if needed)
   (checks if role is allowed)
        │
        ▼
   Controller function
   (business logic)
        │
        │  Mongoose query
        ▼
   MongoDB Atlas
   (stores/retrieves data)
        │
        │  JSON response
        ▼
   React component
   (updates state → re-renders UI)
```

---

## 🌐 Frontend Entry Points

### How the Frontend Starts

```
index.html
    └── loads main.jsx
            └── renders <App />
                    └── wraps everything in <AuthProvider>
                            └── <BrowserRouter>
                                    └── Routes
```

### Page Routes

| URL | Component | Access |
|-----|-----------|--------|
| `/` | `Home.jsx` | Public |
| `/login` | `Login.jsx` | Public |
| `/register` | `Register.jsx` | Public |
| `/dashboard` | `Dashboard.jsx` | Logged in users only |
| `/admin` | `AdminPanel.jsx` | Admin role only |

### How ProtectedRoute Works

```
User visits /dashboard
        │
        ▼
ProtectedRoute checks:
  isAuthenticated? (token in localStorage)
        │
   NO ──┼──► redirect to /login
        │
   YES  ▼
  requiredRole check?
        │
   FAIL ┼──► redirect to /dashboard
        │
   PASS ▼
  Render the page
```

---

## 🔌 Where Frontend Plugs Into Backend

### axios.js — The Bridge

```javascript
// frontend/src/api/axios.js
const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1'  ← Backend URL
});

// BEFORE every request:
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// AFTER every response:
// If 401 → auto logout + redirect to /login
```

**Every API call in the frontend uses this `api` instance.**

---

## 📡 API Reference

### Backend Entry Point

```
server.js → app.listen(5000)
         → /api/v1/auth   → auth.routes.js
         → /api/v1/tasks  → task.routes.js
         → /api/v1/admin  → admin.routes.js
```

---

### Auth Routes (`/api/v1/auth`)

| Method | Endpoint | Controller | Who Calls It | What It Does |
|--------|----------|------------|--------------|--------------|
| POST | `/auth/register` | `auth.controller.register` | `Register.jsx` | Creates user, returns JWT |
| POST | `/auth/login` | `auth.controller.login` | `Login.jsx` | Verifies password, returns JWT |
| GET | `/auth/profile` | `auth.controller.getProfile` | (optional) | Returns current user info |

**Register Flow:**
```
Register.jsx
  form submit
      │
      ▼
AuthContext.register(name, email, password)
      │
      ▼
api.post('/auth/register', { name, email, password })
      │
      ▼
auth.routes.js → validation → auth.controller.register()
      │
      ▼
bcrypt.hash(password) → User.create() → jwt.sign()
      │
      ▼
Response: { user, token }
      │
      ▼
localStorage.setItem('token', token)
navigate('/dashboard')
```

**Login Flow:**
```
Login.jsx
  form submit
      │
      ▼
AuthContext.login(email, password)
      │
      ▼
api.post('/auth/login', { email, password })
      │
      ▼
auth.controller.login()
  User.findOne({ email })
  bcrypt.compare(password, user.password)
  jwt.sign({ userId, email, role })
      │
      ▼
Response: { user, token }
      │
      ▼
localStorage.setItem('token', token)
navigate('/dashboard')
```

---

### Task Routes (`/api/v1/tasks`)

All task routes require: `Authorization: Bearer <token>` header

| Method | Endpoint | Controller | Who Calls It | What It Does |
|--------|----------|------------|--------------|--------------|
| GET | `/tasks` | `task.controller.getAllTasks` | `Dashboard.jsx` | Get tasks (filtered by role) |
| GET | `/tasks/stats` | `task.controller.getStats` | `Dashboard.jsx` | Get task counts |
| GET | `/tasks/:id` | `task.controller.getTaskById` | - | Get single task |
| POST | `/tasks` | `task.controller.createTask` | `TaskForm.jsx` | Create new task |
| PUT | `/tasks/:id` | `task.controller.updateTask` | `TaskForm.jsx` | Update task |
| DELETE | `/tasks/:id` | `task.controller.deleteTask` | `Dashboard.jsx` | Delete task |

**Get Tasks Flow:**
```
Dashboard.jsx mounts
      │
      ▼
useEffect → fetchTasks()
      │
      ▼
api.get('/tasks?status=pending&priority=high')
      │
      ▼
axios interceptor adds: Authorization: Bearer eyJ...
      │
      ▼
Express receives: GET /api/v1/tasks
      │
      ▼
auth.middleware.js:
  jwt.verify(token, JWT_SECRET)
  req.user = { userId: '...', role: 'user' }
      │
      ▼
task.controller.getAllTasks():
  if role === 'admin'  → see ALL tasks
  if role === 'manager' → see own + team tasks
  if role === 'user'   → see only own tasks
  Task.find(filter).sort().skip().limit()
      │
      ▼
Response: { tasks: [...], pagination: {...} }
      │
      ▼
setTasks(response.data.tasks)
React re-renders task cards
```

**Create Task Flow:**
```
User clicks "+ New Task"
      │
      ▼
TaskForm modal opens
      │
      ▼
User fills form → clicks Create
      │
      ▼
Dashboard.handleCreate(formData)
      │
      ▼
api.post('/tasks', { title, description, status, priority, due_date })
      │
      ▼
task.controller.createTask():
  Task.create({ userId: req.user.userId, ...formData })
      │
      ▼
Response: { message, task }
      │
      ▼
fetchTasks() called again → list refreshes
```

---

### Admin Routes (`/api/v1/admin`)

All admin routes require: JWT token + `role === 'admin'`

| Method | Endpoint | Controller | Who Calls It | What It Does |
|--------|----------|------------|--------------|--------------|
| GET | `/admin/users` | `admin.controller.getAllUsers` | `AdminPanel.jsx` | List all users |
| GET | `/admin/users/:id` | `admin.controller.getUserById` | `AdminPanel.jsx` | User details + task stats |
| PUT | `/admin/users/:id/role` | `admin.controller.updateUserRole` | `AdminPanel.jsx` | Change user role |
| PUT | `/admin/users/:id/team` | `admin.controller.updateUserTeam` | - | Assign team members |
| GET | `/admin/tasks` | `admin.controller.getAllTasks` | `AdminPanel.jsx` | All tasks system-wide |
| DELETE | `/admin/tasks/:id` | `admin.controller.deleteTask` | `AdminPanel.jsx` | Delete any task |
| GET | `/admin/stats` | `admin.controller.getStats` | `AdminPanel.jsx` | System-wide statistics |

---

## 🔐 Authentication & Authorization Flow

### JWT Token Lifecycle

```
1. User logs in
        │
        ▼
2. Server creates token:
   jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' })
        │
        ▼
3. Token sent to client in response body
        │
        ▼
4. Client stores: localStorage.setItem('token', token)
        │
        ▼
5. Every API request:
   axios interceptor reads token from localStorage
   Adds header: Authorization: Bearer eyJhbGci...
        │
        ▼
6. Server verifies:
   jwt.verify(token, JWT_SECRET)
   Decodes: { userId, email, role, iat, exp }
   Sets: req.user = decoded
        │
        ▼
7. Token expires after 7 days
   Server returns 401
   axios interceptor catches 401
   Clears localStorage
   Redirects to /login
```

### Role-Based Access

```
Roles: user < manager < admin

user    → can only see/edit their own tasks
manager → can see their own tasks + their team members' tasks
admin   → can see everything, manage users, change roles
```

---

## 🗄️ Database Models

### User Model (`models/User.js`)

```
User {
  _id        : ObjectId (auto)
  name       : String (required)
  email      : String (unique, required)
  password   : String (bcrypt hashed)
  role       : String (user | manager | admin)
  teamMembers: [ObjectId] → ref: User (for managers)
  createdAt  : Date (auto)
  updatedAt  : Date (auto)
}
```

### Task Model (`models/Task.js`)

```
Task {
  _id        : ObjectId (auto)
  userId     : ObjectId → ref: User (owner)
  title      : String (required, max 200)
  description: String
  status     : String (pending | in_progress | completed)
  priority   : String (low | medium | high)
  dueDate    : Date
  attachmentUrl: String
  createdAt  : Date (auto)
  updatedAt  : Date (auto)
}
```

---

## ⚙️ Environment Variables

### Backend `.env`

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmaster
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## 🚀 Running the Project

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Terminal 1 — Backend

```bash
cd day13/taskmaster-pro/backend
npm install
npm run dev
# Server starts at http://localhost:5000
```

### Terminal 2 — Frontend

```bash
cd day13/taskmaster-pro/frontend
npm install
npm run dev
# App starts at http://localhost:5173
```

### Open in browser

```
http://localhost:5173
```

---

## 🧪 Testing the API (Postman / curl)

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"123456"}'
```

### Get Tasks (with token)
```bash
curl http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Task
```bash
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","priority":"high","status":"pending"}'
```

---

## ☁️ AWS Deployment

### Architecture

```
Users
  ↓
CloudFront (HTTPS + CDN)
  ↓
S3 Bucket (React /dist files)
  ↓ (API calls)
EC2 t2.micro (Node.js + PM2)
  ↓
MongoDB Atlas (cloud database)
```

### Steps

1. **MongoDB Atlas** → Create free cluster → get connection string
2. **EC2** → Launch Ubuntu t2.micro → upload backend → run with PM2
3. **S3** → Create bucket → enable static hosting → upload `npm run build` output
4. **CloudFront** → Point to S3 → get HTTPS URL
5. **Update** `axios.js` baseURL to EC2 public IP
6. **Update** CORS in `server.js` to allow S3/CloudFront URL

### Free Tier Costs: $0/month

| Service | Free Limit |
|---------|-----------|
| EC2 t2.micro | 750 hrs/month |
| S3 | 5 GB storage |
| CloudFront | 1 TB transfer |
| MongoDB Atlas | 512 MB |

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| HTTP Client | Axios (with interceptors) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcrypt |
| Validation | express-validator |
| File Upload | Multer |
| Process Manager | PM2 (production) |
| Deployment | AWS EC2 + S3 + CloudFront |