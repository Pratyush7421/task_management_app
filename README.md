# TaskMaster Pro

A full-stack MERN task management application with role-based access control (RBAC), JWT authentication, OTP email verification, email notifications, and a modern React frontend.

---

## 🏗️ Project Structure

```
taskmaster-pro/
├── backend/                    ← Node.js + Express API server
│   ├── server.js               ← Entry point (starts on port 5000)
│   ├── .env                    ← Environment variables
│   ├── package.json
│   ├── tests/
│   │   └── admin.service.test.js  ← Jest unit tests
│   └── src/
│       ├── config/
│       │   └── database.js     ← MongoDB connection
│       ├── models/
│       │   ├── User.js         ← User schema (name, email, password, role, otp, isVerified)
│       │   ├── Task.js         ← Task schema (title, status, priority, dueDate, createdBy)
│       │   └── EmailLog.js     ← Email audit log schema
│       ├── controllers/
│       │   ├── auth.controller.js    ← register, verifyOTP, resendOTP, login, getProfile
│       │   ├── task.controller.js    ← CRUD + stats + filters
│       │   └── admin.controller.js   ← user management, task creation, system stats
│       ├── routes/
│       │   ├── auth.routes.js        ← /api/v1/auth/*
│       │   ├── task.routes.js        ← /api/v1/tasks/*
│       │   └── admin.routes.js       ← /api/v1/admin/*
│       ├── services/
│       │   ├── auth.service.js       ← Auth business logic + DB
│       │   ├── task.service.js       ← Task business logic + DB
│       │   ├── admin.service.js      ← Admin business logic + DB
│       │   └── email.service.js      ← Nodemailer / Gmail SMTP
│       ├── emailTemplates/
│       │   ├── index.js                          ← Template registry
│       │   ├── taskNotification.template.js      ← Task notification template builder
│       │   └── taskNotification.template.html    ← HTML email template
│       └── middleware/
│           ├── auth.middleware.js    ← JWT verification
│           ├── role.middleware.js    ← Role-based access (admin/manager/user)
│           ├── validate.middleware.js ← express-validator rules
│           └── error.middleware.js   ← Global error handler
│
└── frontend/                   ← React + Vite app (runs on port 5173)
    ├── index.html              ← HTML shell (Inter font loaded here)
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx            ← React entry point
        ├── App.jsx             ← Routes setup
        ├── App.css             ← Global enterprise design system styles
        ├── api/
        │   └── axios.js        ← Axios instance (baseURL + token interceptor)
        ├── context/
        │   └── AuthContext.jsx ← Global auth state
        ├── components/
        │   ├── Navbar.jsx          ← Sticky top navigation bar
        │   ├── ProtectedRoute.jsx  ← Route guard (auth + role check)
        │   ├── TaskForm.jsx        ← Create/Edit task modal form
        │   └── AdminTaskForm.jsx   ← Admin: create task for any user
        └── pages/
            ├── Home.jsx        ← Landing page (/)
            ├── Login.jsx       ← (/login)
            ├── Register.jsx    ← (/register)
            ├── VerifyOTP.jsx   ← (/verify-otp) - email OTP verification
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
   (calls service layer)
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
| `/verify-otp` | `VerifyOTP.jsx` | Public (post-registration) |
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
| POST | `/auth/register` | `auth.controller.register` | `Register.jsx` | Creates user, sends OTP email |
| POST | `/auth/verify-otp` | `auth.controller.verifyOTP` | `VerifyOTP.jsx` | Verifies OTP, returns JWT |
| POST | `/auth/resend-otp` | `auth.controller.resendOTP` | `VerifyOTP.jsx` | Resends OTP email |
| POST | `/auth/login` | `auth.controller.login` | `Login.jsx` | Verifies password, returns JWT |
| GET | `/auth/profile` | `auth.controller.getProfile` | (optional) | Returns current user info |

**Registration + OTP Flow:**
```
Register.jsx
  form submit
      │
      ▼
api.post('/auth/register', { name, email, password })
      │
      ▼
auth.service.registerUser()
  → User.create() + sendOTPEmail()
      │
      ▼
Response: { email, requiresVerification: true }
      │
      ▼
navigate('/verify-otp?email=...')
      │
      ▼
VerifyOTP.jsx
  user enters 6-digit code
      │
      ▼
api.post('/auth/verify-otp', { email, otp })
      │
      ▼
auth.service.verifyUserOTP()
  → user.save() + jwt.sign()
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
api.post('/auth/login', { email, password })
      │
      ▼
auth.controller.login()
  User.findOne({ email })
  bcrypt.compare(password, user.password)
  Check isVerified === true
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
| POST | `/admin/tasks` | `admin.controller.createTaskForUser` | `AdminTaskForm.jsx` | Admin creates task for any user + sends email |
| DELETE | `/admin/tasks/:id` | `admin.controller.deleteTask` | `AdminPanel.jsx` | Delete any task |
| GET | `/admin/stats` | `admin.controller.getStats` | `AdminPanel.jsx` | System-wide statistics |

**Admin Create Task for User Flow:**
```
Admin clicks "+ Add Task for User"
      │
      ▼
AdminTaskForm modal opens
  (fetches user list from /admin/users)
      │
      ▼
Admin selects user, fills form → clicks Create
      │
      ▼
Dashboard.handleCreateTaskForUser(formData)
      │
      ▼
api.post('/admin/tasks', { userId, title, description, status, priority, due_date })
      │
      ▼
admin.controller.createTaskForUser()
      │
      ▼
admin.service.createTaskForUser()
  1. User.findById(userId) → verify user exists
  2. Task.create({ userId, title, ..., createdBy: adminId })
  3. sendTaskNotification(task, targetUser, adminUser)
     → email.service.sendTaskNotificationEmail()
     → EmailLog.create({ status, taskId, recipientEmail, ... })
      │
      ▼
Response: { message, task, emailSent, emailStatus }
      │
      ▼
fetchTasks() + fetchStats() called → dashboard refreshes
```

---

## 🔐 Authentication & Authorization Flow

### JWT Token Lifecycle

```
1. User registers → OTP sent to email
        │
        ▼
2. User verifies OTP → account activated
        │
        ▼
3. Server creates token:
   jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' })
        │
        ▼
4. Token sent to client in response body
        │
        ▼
5. Client stores: localStorage.setItem('token', token)
        │
        ▼
6. Every API request:
   axios interceptor reads token from localStorage
   Adds header: Authorization: Bearer eyJhbGci...
        │
        ▼
7. Server verifies:
   jwt.verify(token, JWT_SECRET)
   Decodes: { userId, email, role, iat, exp }
   Sets: req.user = decoded
        │
        ▼
8. Token expires after 7 days
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
admin   → can see everything, manage users, change roles, create tasks for any user
```

---

## 🗄️ Database Models

### User Model (`models/User.js`)

```
User {
  _id        : ObjectId (auto)
  name       : String (required, min 2)
  email      : String (unique, required, lowercase)
  password   : String (bcrypt hashed, required)
  role       : String (user | manager | admin, default: user)
  teamMembers: [ObjectId] → ref: User (for managers)
  isVerified : Boolean (default: false)
  otp        : String (null after verification)
  otpExpiry  : Date (null after verification)
  createdAt  : Date (auto)
  updatedAt  : Date (auto)
}
```

### Task Model (`models/Task.js`)

```
Task {
  _id          : ObjectId (auto)
  userId       : ObjectId → ref: User (owner, required)
  title        : String (required, max 200)
  description  : String (optional)
  status       : String (pending | in_progress | completed, default: pending)
  priority     : String (low | medium | high, default: medium)
  dueDate      : Date (optional)
  attachmentUrl: String (optional)
  createdBy    : ObjectId → ref: User (admin who created on behalf, optional)
  createdAt    : Date (auto)
  updatedAt    : Date (auto)
}
```

### EmailLog Model (`models/EmailLog.js`)

```
EmailLog {
  _id           : ObjectId (auto)
  recipientEmail: String (required)
  recipientName : String
  subject       : String
  templateName  : String
  taskId        : ObjectId → ref: Task
  status        : String (SUCCESS | FAILED)
  errorMessage  : String (null on success)
  sentAt        : Date
  createdAt     : Date (auto)
  updatedAt     : Date (auto)
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

# Email (Gmail SMTP)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

---

## 🚀 Running the Project

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Gmail account with App Password enabled (for email features)

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

## 🧪 Testing

### Run Unit Tests

```bash
cd day13/taskmaster-pro/backend
npm test
```

Tests are located in `backend/tests/` and use **Jest**.

Current test coverage:
- `admin.service.test.js` — Tests `createTaskForUser()` and email notification payload building

### Testing the API (Postman / curl)

#### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"123456"}'
```

#### Verify OTP
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","otp":"123456"}'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"123456"}'
```

#### Get Tasks (with token)
```bash
curl http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Create Task
```bash
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","priority":"high","status":"pending"}'
```

#### Admin: Create Task for User
```bash
curl -X POST http://localhost:5000/api/v1/admin/tasks \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID_HERE","title":"Assigned Task","priority":"high","status":"pending"}'
```

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| HTTP Client | Axios (with interceptors) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcrypt |
| Email | Nodemailer (Gmail SMTP) |
| Validation | express-validator |
| Testing | Jest |
| File Upload | Multer |
| Process Manager | PM2 (production) |
| Deployment | AWS EC2 + S3 + CloudFront |