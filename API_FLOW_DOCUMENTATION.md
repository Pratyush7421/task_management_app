# TaskMaster Pro - Complete API Flow Documentation

## Overview
This document traces every API endpoint from request entry point through middleware, controller, service layer, database operations, and response generation.

---

## 🏗️ Architecture Overview

### 3-Layer Architecture
```
Request → Route → Middleware → Controller → Service → Model (MongoDB)
```

| Layer | File Location | Responsibility |
|-------|--------------|----------------|
| **Route** | `src/routes/*.routes.js` | URL mapping + middleware chain |
| **Middleware** | `src/middleware/*.middleware.js` | Auth, validation, RBAC, error handling |
| **Controller** | `src/controllers/*.controller.js` | Receive request, call service, send response |
| **Service** | `src/services/*.service.js` | Business logic + DB calls |
| **Model** | `src/models/*.js` | Mongoose schema definitions |

### Folder Structure
```
backend/src/
├── config/
│   └── database.js              ← MongoDB connection
├── controllers/
│   ├── auth.controller.js       ← thin: calls AuthService
│   ├── task.controller.js       ← thin: calls TaskService
│   └── admin.controller.js      ← thin: calls AdminService
├── middleware/
│   ├── auth.middleware.js        ← JWT verification
│   ├── role.middleware.js        ← RBAC (isAdmin, isManager)
│   ├── validate.middleware.js    ← All validation rules
│   └── error.middleware.js       ← Global error handler
├── models/
│   ├── User.js                  ← User schema (with OTP fields)
│   ├── Task.js                  ← Task schema (with createdBy field)
│   └── EmailLog.js              ← Email audit log schema
├── routes/
│   ├── auth.routes.js           ← /api/v1/auth/*
│   ├── task.routes.js           ← /api/v1/tasks/*
│   └── admin.routes.js          ← /api/v1/admin/*
├── services/
│   ├── auth.service.js          ← Auth business logic + DB
│   ├── task.service.js          ← Task business logic + DB
│   ├── admin.service.js         ← Admin business logic + DB
│   └── email.service.js         ← Nodemailer / Gmail SMTP
└── emailTemplates/
    ├── index.js                          ← Template registry
    ├── taskNotification.template.js      ← Template data builder
    └── taskNotification.template.html    ← HTML email template
```

### Request Flow Example (Register)
```
POST /api/v1/auth/register
    ↓
server.js → app.use('/api/v1/auth', authRoutes)
    ↓
auth.routes.js → registerValidation, handleValidationErrors, authController.register
    ↓
validate.middleware.js → registerValidation[] → handleValidationErrors()
    ↓
auth.controller.js → register() → calls AuthService.registerUser(req.body)
    ↓
auth.service.js → registerUser() → User.findOne(), bcrypt.hash(), User.create(), sendOTPEmail()
    ↓
Response → res.status(201).json(result)
```

---

## 🔐 AUTHENTICATION ROUTES (`/api/v1/auth`)

### 1. POST `/api/v1/auth/register`
**Purpose:** Register a new user and send OTP verification email

**Request Flow:**
```
CLIENT REQUEST
    ↓
Route: POST /api/v1/auth/register
    ↓
validate.middleware.js → registerValidation
    - body('email').isEmail()
    - body('password').isLength({ min: 6 })
    - body('name').trim().isLength({ min: 2 })
    ↓
validate.middleware.js → handleValidationErrors()
    - If errors: Return 400 { errors: [...] }
    ↓
auth.controller.js → register()
    - Calls: AuthService.registerUser(req.body)
    - Returns: res.status(201).json(result)
    ↓
auth.service.js → registerUser({ name, email, password })
    1. User.findOne({ email }) → Check if user exists → 409 if exists
    2. bcrypt.hash(password, 10) → Hash password
    3. email.service.js → generateOTP() → 6-digit random OTP
    4. otpExpiry = Date.now() + 10 * 60 * 1000 → 10 minutes
    5. User.create({ email, hashedPassword, name, role: 'user', isVerified: false, otp, otpExpiry })
    6. email.service.js → sendOTPEmail(email, otp) → Gmail SMTP via nodemailer
       → If email fails: User.findByIdAndDelete(user._id) → throw 500
    7. Return { email, requiresVerification: true }
    ↓
RESPONSE (201 Created)
{
  "message": "Registration successful. Please check your email for OTP.",
  "email": "user@example.com",
  "requiresVerification": true
}
```

---

### 2. POST `/api/v1/auth/verify-otp`
**Purpose:** Verify OTP and activate user account

**Request Flow:**
```
CLIENT REQUEST
    ↓
Route: POST /api/v1/auth/verify-otp
    ↓
No validation middleware (public endpoint)
    ↓
auth.controller.js → verifyOTP()
    - Calls: AuthService.verifyUserOTP(req.body)
    - Returns: res.json(result)
    ↓
auth.service.js → verifyUserOTP({ email, otp })
    1. User.findOne({ email }) → Find user → 404 if not found
    2. Check user.isVerified === true → 400 if already verified
    3. Check user.otp !== otp → 400 if invalid OTP
    4. Check Date.now() > user.otpExpiry → 400 if expired
    5. user.isVerified = true, user.otp = null, user.otpExpiry = null
    6. user.save() → Update in MongoDB
    7. jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' })
    8. Return { user: { id, email, name, role }, token }
    ↓
RESPONSE (200 OK)
{
  "message": "Email verified successfully",
  "user": { "id": "...", "email": "...", "name": "...", "role": "user" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 3. POST `/api/v1/auth/resend-otp`
**Purpose:** Generate and resend OTP to unverified user

**Request Flow:**
```
CLIENT REQUEST
    ↓
Route: POST /api/v1/auth/resend-otp
    ↓
No validation middleware (public endpoint)
    ↓
auth.controller.js → resendOTP()
    - Calls: AuthService.resendUserOTP(req.body)
    - Returns: res.json(result)
    ↓
auth.service.js → resendUserOTP({ email })
    1. User.findOne({ email }) → Find user → 404 if not found
    2. Check user.isVerified === true → 400 if already verified
    3. email.service.js → generateOTP() → New 6-digit OTP
    4. user.otp = newOtp, user.otpExpiry = Date.now() + 10 * 60 * 1000
    5. user.save() → Update in MongoDB
    6. email.service.js → sendOTPEmail(email, otp) → Gmail SMTP
       → If fails: throw 500
    7. Return { message: 'OTP sent successfully. Please check your email.' }
    ↓
RESPONSE (200 OK)
{
  "message": "OTP sent successfully. Please check your email."
}
```

---

### 4. POST `/api/v1/auth/login`
**Purpose:** Authenticate user and return JWT token

**Request Flow:**
```
CLIENT REQUEST
    ↓
Route: POST /api/v1/auth/login
    ↓
validate.middleware.js → loginValidation
    - body('email').isEmail()
    - body('password').exists()
    ↓
validate.middleware.js → handleValidationErrors()
    - If errors: Return 400 { errors: [...] }
    ↓
auth.controller.js → login()
    - Calls: AuthService.loginUser(req.body)
    - Returns: res.json(result)
    ↓
auth.service.js → loginUser({ email, password })
    1. User.findOne({ email }) → Find user → 401 if not found
    2. bcrypt.compare(password, user.password) → 401 if invalid
    3. Check user.isVerified === false → 403 if not verified
       → error.requiresVerification = true, error.email = user.email
    4. jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' })
    5. Return { user: { id, email, name, role }, token }
    ↓
RESPONSE (200 OK)
{
  "message": "Login successful",
  "user": { "id": "...", "email": "...", "name": "...", "role": "user" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 5. GET `/api/v1/auth/profile`
**Purpose:** Get current authenticated user's profile

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: GET /api/v1/auth/profile
    ↓
auth.middleware.js → authenticateToken()
    - Extract token from "Bearer <token>"
    - jwt.verify(token, JWT_SECRET) → 403 if invalid/expired
    - req.user = { userId, email, role }
    ↓
auth.controller.js → getProfile()
    - Calls: AuthService.getUserProfile(req.user.userId)
    - Returns: res.json(result)
    ↓
auth.service.js → getUserProfile(userId)
    1. User.findById(userId).select('-password') → 404 if not found
    2. Return { user }
    ↓
RESPONSE (200 OK)
{
  "user": {
    "_id": "...", "email": "...", "name": "...", "role": "user",
    "teamMembers": [], "isVerified": true,
    "createdAt": "...", "updatedAt": "..."
  }
}
```

---

## 📋 TASK ROUTES (`/api/v1/tasks`)

### 1. GET `/api/v1/tasks`
**Purpose:** Fetch user's tasks with filtering and sorting

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: GET /api/v1/tasks?status=pending&priority=high&search=bug
    ↓
auth.middleware.js → authenticateToken()
    - Verify JWT → req.user = { userId, email, role }
    ↓
task.controller.js → getAllTasks()
    - Calls: TaskService.getAllTasks(req.user.userId, req.user.role, req.query)
    - Returns: res.json(result)
    ↓
task.service.js → getAllTasks(userId, userRole, { status, priority, search })
    1. buildTaskFilter(userId, userRole, { status, priority, search })
       IF role === 'admin': filter = {}
       IF role === 'manager': User.findById(userId).select('teamMembers')
           → filter = { userId: { $in: [managerId, ...teamMembers] } }
       IF role === 'user': filter = { userId }
       → Apply status, priority, search filters
    2. Task.find(filter).sort({ createdAt: -1 }).lean()
    3. Return { tasks }
    ↓
RESPONSE (200 OK)
{
  "tasks": [...]
}
```

---

### 2. GET `/api/v1/tasks/stats`
**Purpose:** Get task statistics for current user

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: GET /api/v1/tasks/stats
    ↓
auth.middleware.js → authenticateToken()
    ↓
task.controller.js → getStats()
    - Calls: TaskService.getTaskStats(req.user.userId)
    - Returns: res.json({ stats })
    ↓
task.service.js → getTaskStats(userId)
    1. Task.aggregate([
         { $match: { userId: ObjectId(userId) } },
         { $group: { _id: null, total, pending, in_progress, completed, high_priority } }
       ])
    2. Return stats object (or zeros if no tasks)
    ↓
RESPONSE (200 OK)
{
  "stats": { "total": 25, "pending": 10, "in_progress": 8, "completed": 7, "high_priority": 5 }
}
```

---

### 3. GET `/api/v1/tasks/:id`
**Purpose:** Fetch a single task by ID

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: GET /api/v1/tasks/:id
    ↓
auth.middleware.js → authenticateToken()
    ↓
task.controller.js → getTaskById()
    - Calls: TaskService.getTaskById(req.params.id, req.user.userId, req.user.role)
    - Returns: res.json(result)
    ↓
task.service.js → getTaskById(taskId, userId, userRole)
    1. filter = admin ? { _id: taskId } : { _id: taskId, userId }
    2. Task.findOne(filter).lean() → 404 if not found
    3. Return { task }
    ↓
RESPONSE (200 OK)
{ "task": { "_id": "...", "title": "...", "status": "...", ... } }
```

---

### 4. POST `/api/v1/tasks`
**Purpose:** Create a new task

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: POST /api/v1/tasks
    ↓
auth.middleware.js → authenticateToken()
    ↓
validate.middleware.js → taskValidation
    - body('title').isLength({ min: 1, max: 200 })
    - body('status').optional().isIn([...])
    - body('priority').optional().isIn([...])
    - body('due_date').optional().isISO8601()
    ↓
validate.middleware.js → handleValidationErrors()
    ↓
task.controller.js → createTask()
    - Calls: TaskService.createTask(req.user.userId, req.body)
    - Returns: res.status(201).json({ message, ...result })
    ↓
task.service.js → createTask(userId, taskData)
    1. Task.create({ userId, title, description, status, priority, dueDate })
    2. Return { task }
    ↓
RESPONSE (201 Created)
{ "message": "Task created successfully", "task": { ... } }
```

---

### 5. PUT `/api/v1/tasks/:id`
**Purpose:** Update an existing task

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: PUT /api/v1/tasks/:id
    ↓
auth.middleware.js → authenticateToken()
    ↓
validate.middleware.js → taskValidation → handleValidationErrors()
    ↓
task.controller.js → updateTask()
    - Calls: TaskService.updateTask(req.params.id, req.user.userId, req.user.role, req.body)
    - Returns: res.json({ message, ...result })
    ↓
task.service.js → updateTask(taskId, userId, userRole, updateData)
    1. ownerFilter = admin ? { _id: taskId } : { _id: taskId, userId }
    2. Task.findOne(ownerFilter) → 404 if not found
    3. Build updateFields (only include provided fields)
    4. Task.findByIdAndUpdate(taskId, updateFields, { new: true, runValidators: true })
    5. Return { task }
    ↓
RESPONSE (200 OK)
{ "message": "Task updated successfully", "task": { ... } }
```

---

### 6. DELETE `/api/v1/tasks/:id`
**Purpose:** Delete a task

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: DELETE /api/v1/tasks/:id
    ↓
auth.middleware.js → authenticateToken()
    ↓
task.controller.js → deleteTask()
    - Calls: TaskService.deleteTask(req.params.id, req.user.userId, req.user.role)
    - Returns: res.json(result)
    ↓
task.service.js → deleteTask(taskId, userId, userRole)
    1. filter = admin ? { _id: taskId } : { _id: taskId, userId }
    2. Task.findOneAndDelete(filter) → 404 if not found
    3. Return { message: 'Task deleted successfully' }
    ↓
RESPONSE (200 OK)
{ "message": "Task deleted successfully" }
```

---

## 👨‍💼 ADMIN ROUTES (`/api/v1/admin`)

### 1. GET `/api/v1/admin/users`
**Purpose:** Fetch all users (admin only)

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: GET /api/v1/admin/users
    ↓
auth.middleware.js → authenticateToken()
    ↓
role.middleware.js → isAdmin()
    - Check req.user.role === 'admin' → 403 if not
    ↓
admin.controller.js → getAllUsers()
    - Calls: AdminService.getAllUsers(req.query)
    - Returns: res.json(result)
    ↓
admin.service.js → getAllUsers({ role, search })
    1. Build filter (role, search regex)
    2. User.find(filter).select('-password').populate('teamMembers', 'name email role')
       .sort({ createdAt: -1 }).lean()
    3. Return { users }
    ↓
RESPONSE (200 OK)
{ "users": [...] }
```

---

### 2. GET `/api/v1/admin/users/:id`
**Purpose:** Fetch single user with task statistics (admin only)

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: GET /api/v1/admin/users/:id
    ↓
auth.middleware.js → authenticateToken()
    ↓
role.middleware.js → isAdmin()
    ↓
admin.controller.js → getUserById()
    - Calls: AdminService.getUserById(req.params.id)
    - Returns: res.json(result)
    ↓
admin.service.js → getUserById(userId)
    1. User.findById(userId).select('-password').populate('teamMembers').lean() → 404 if not found
    2. Task.aggregate([{ $match: { userId: ObjectId(userId) } }, { $group: { ... } }])
    3. Return { user, taskStats }
    ↓
RESPONSE (200 OK)
{ "user": { ... }, "taskStats": { "total": 15, "pending": 5, ... } }
```

---

### 3. PUT `/api/v1/admin/users/:id/role`
**Purpose:** Update user's role (admin only)

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: PUT /api/v1/admin/users/:id/role
    ↓
auth.middleware.js → authenticateToken()
    ↓
role.middleware.js → isAdmin()
    ↓
validate.middleware.js → roleUpdateValidation
    - body('role').isIn(['user', 'manager', 'admin'])
    ↓
validate.middleware.js → handleValidationErrors()
    ↓
admin.controller.js → updateUserRole()
    - Calls: AdminService.updateUserRole(req.params.id, req.body.role, req.user.userId)
    - Returns: res.json(result)
    ↓
admin.service.js → updateUserRole(userId, role, currentUserId)
    1. Check userId === currentUserId && role !== 'admin' → 400 (self-demotion)
    2. User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password') → 404 if not found
    3. Return { user, message }
    ↓
RESPONSE (200 OK)
{ "message": "User role updated to manager", "user": { ... } }
```

---

### 4. PUT `/api/v1/admin/users/:id/team`
**Purpose:** Assign team members to a manager (admin only)

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: PUT /api/v1/admin/users/:id/team
    ↓
auth.middleware.js → authenticateToken()
    ↓
role.middleware.js → isAdmin()
    ↓
admin.controller.js → updateUserTeam()
    - Calls: AdminService.updateUserTeam(req.params.id, req.body.teamMemberIds)
    - Returns: res.json(result)
    ↓
admin.service.js → updateUserTeam(managerId, teamMemberIds)
    1. User.findById(managerId) → 404 if not found
    2. Check role !== 'manager' && role !== 'admin' → 400
    3. Check !Array.isArray(teamMemberIds) → 400
    4. User.find({ _id: { $in: teamMemberIds } }) → 400 if invalid IDs
    5. Check teamMemberIds.includes(managerId) → 400 (self-assignment)
    6. manager.teamMembers = teamMemberIds → manager.save()
    7. User.findById(managerId).populate('teamMembers', 'name email role')
    8. Return { manager, message }
    ↓
RESPONSE (200 OK)
{ "message": "Team members updated successfully", "manager": { ... } }
```

---

### 5. GET `/api/v1/admin/tasks`
**Purpose:** Fetch all tasks across all users (admin only)

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: GET /api/v1/admin/tasks
    ↓
auth.middleware.js → authenticateToken()
    ↓
role.middleware.js → isAdmin()
    ↓
admin.controller.js → getAllTasks()
    - Calls: AdminService.getAllTasksAdmin(req.query)
    - Returns: res.json(result)
    ↓
admin.service.js → getAllTasksAdmin({ status, priority, userId, search })
    1. Build filter (status, priority, userId, search)
    2. Task.find(filter).populate('userId', 'name email role').sort({ createdAt: -1 }).lean()
    3. Return { tasks }
    ↓
RESPONSE (200 OK)
{ "tasks": [...] }
```

---

### 6. POST `/api/v1/admin/tasks`
**Purpose:** Admin creates a task for any user, sends email notification, logs email attempt (admin only)

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: POST /api/v1/admin/tasks
    ↓
auth.middleware.js → authenticateToken()
    ↓
role.middleware.js → isAdmin()
    ↓
admin.controller.js → createTaskForUser()
    - Builds adminUser = { _id: req.user.userId, name: req.user.name, email: req.user.email }
    - Calls: AdminService.createTaskForUser(req.body, adminUser)
    - Returns: res.status(201).json({ message, task, emailSent, emailStatus })
    ↓
admin.service.js → createTaskForUser({ userId, title, description, status, priority, due_date }, adminUser)
    1. User.findById(userId).select('name email') → 404 if user not found
    2. Task.create({
         userId: targetUser._id,
         title,
         description,
         status,
         priority,
         dueDate: due_date,        ← maps due_date → dueDate
         createdBy: adminUser._id  ← records which admin created it
       })
    3. sendTaskNotification(task, targetUser, adminUser)  ← non-blocking
       ↓
       email.service.js → buildTaskNotificationEmailData()
           → Builds { to, subject, html } from taskNotification.template.js
       ↓
       email.service.js → sendTaskNotificationEmail(emailData)
           → nodemailer transporter.sendMail() via Gmail SMTP
           → Returns { success: true/false, error }
       ↓
       EmailLog.create({
         recipientEmail, recipientName, subject,
         templateName: 'taskNotification',
         taskId: task._id,
         status: 'SUCCESS' | 'FAILED',
         errorMessage, sentAt
       })
    4. Return { task, emailSent, emailStatus, emailError }
    ↓
RESPONSE (201 Created)
{
  "message": "Task created successfully for user. Notification email sent successfully.",
  "task": {
    "_id": "...", "userId": "...", "title": "...", "status": "pending",
    "priority": "high", "dueDate": "...", "createdBy": "adminId", ...
  },
  "emailSent": true,
  "emailStatus": "SUCCESS"
}
```

**Note:** Email notification is non-blocking. If email sending fails, the task is still created and returned. The failure is logged in `EmailLog` with `status: 'FAILED'`.

---

### 7. DELETE `/api/v1/admin/tasks/:id`
**Purpose:** Delete any task (admin only)

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: DELETE /api/v1/admin/tasks/:id
    ↓
auth.middleware.js → authenticateToken()
    ↓
role.middleware.js → isAdmin()
    ↓
admin.controller.js → deleteTask()
    - Calls: AdminService.deleteTaskAdmin(req.params.id)
    - Returns: res.json(result)
    ↓
admin.service.js → deleteTaskAdmin(taskId)
    1. Task.findByIdAndDelete(taskId) → 404 if not found
    2. Return { deletedTask, message }
    ↓
RESPONSE (200 OK)
{ "message": "Task deleted successfully", "deletedTask": { ... } }
```

---

### 8. GET `/api/v1/admin/stats`
**Purpose:** Get system-wide statistics (admin only)

**Request Flow:**
```
CLIENT REQUEST (with Authorization header)
    ↓
Route: GET /api/v1/admin/stats
    ↓
auth.middleware.js → authenticateToken()
    ↓
role.middleware.js → isAdmin()
    ↓
admin.controller.js → getStats()
    - Calls: AdminService.getAdminStats()
    - Returns: res.json(result)
    ↓
admin.service.js → getAdminStats()
    1. User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
    2. Task.aggregate([{ $group: { _id: null, total, pending, in_progress, completed } }])
    3. Task.aggregate([{ $group: { _id: '$userId', taskCount } }, { $sort }, { $limit: 10 }])
    4. User.populate(tasksPerUser, { path: '_id', select: 'name email role' })
    5. User.countDocuments()
    6. Return { users: { total, byRole }, tasks, topUsers }
    ↓
RESPONSE (200 OK)
{
  "users": { "total": 150, "byRole": { "user": 120, "manager": 25, "admin": 5 } },
  "tasks": { "total": 500, "pending": 150, "in_progress": 200, "completed": 150 },
  "topUsers": [{ "user": { ... }, "taskCount": 45 }]
}
```

---

## 🔄 Middleware Reference

### `auth.middleware.js` → `authenticateToken()`
```
Extract token from Authorization: "Bearer <token>"
    ↓
jwt.verify(token, JWT_SECRET)
    ↓
If valid: req.user = { userId, email, role } → next()
If invalid/expired: Return 403 Forbidden
```

### `role.middleware.js` → `isAdmin()`
```
Check req.user exists → 401 if not
    ↓
Check req.user.role === 'admin' → 403 if not
    ↓
next()
```

### `validate.middleware.js` → Validation Arrays + `handleValidationErrors()`
```
registerValidation: email, password (min 6), name (min 2)
loginValidation: email, password (exists)
taskValidation: title (1-200), status (enum), priority (enum), due_date (ISO8601)
roleUpdateValidation: role (user|manager|admin)
    ↓
handleValidationErrors():
    validationResult(req) → if errors: Return 400 { errors: [...] }
    → next()
```

### `error.middleware.js` → `errorHandler()`
```
Catch all errors passed via next(err)
    ↓
Use err.statusCode if set, else 500
    ↓
Return { error: err.message }
```

---

## 📊 Service Layer Reference

### `auth.service.js`
| Function | Parameters | DB Operations |
|----------|-----------|---------------|
| `registerUser` | `{ name, email, password }` | `User.findOne`, `User.create`, `User.findByIdAndDelete` |
| `verifyUserOTP` | `{ email, otp }` | `User.findOne`, `user.save` |
| `resendUserOTP` | `{ email }` | `User.findOne`, `user.save` |
| `loginUser` | `{ email, password }` | `User.findOne` |
| `getUserProfile` | `userId` | `User.findById` |

### `task.service.js`
| Function | Parameters | DB Operations |
|----------|-----------|---------------|
| `getAllTasks` | `userId, userRole, queryParams` | `User.findById`, `Task.find` |
| `getTaskStats` | `userId` | `Task.aggregate` |
| `getTaskById` | `taskId, userId, userRole` | `Task.findOne` |
| `createTask` | `userId, taskData` | `Task.create` |
| `updateTask` | `taskId, userId, userRole, updateData` | `Task.findOne`, `Task.findByIdAndUpdate` |
| `deleteTask` | `taskId, userId, userRole` | `Task.findOneAndDelete` |

### `admin.service.js`
| Function | Parameters | DB Operations |
|----------|-----------|---------------|
| `getAllUsers` | `{ role, search }` | `User.find` |
| `getUserById` | `userId` | `User.findById`, `Task.aggregate` |
| `updateUserRole` | `userId, role, currentUserId` | `User.findByIdAndUpdate` |
| `updateUserTeam` | `managerId, teamMemberIds` | `User.findById`, `User.find`, `manager.save`, `User.findById` |
| `getAllTasksAdmin` | `{ status, priority, userId, search }` | `Task.find` |
| `deleteTaskAdmin` | `taskId` | `Task.findByIdAndDelete` |
| `getAdminStats` | none | `User.aggregate`, `Task.aggregate`, `User.populate`, `User.countDocuments` |
| `createTaskForUser` | `taskData, adminUser` | `User.findById`, `Task.create`, `EmailLog.create` |
| `sendTaskNotification` | `task, recipientUser, assignedByUser` | `EmailLog.create` (via `logEmailAttempt`) |
| `logEmailAttempt` | `logData` | `EmailLog.create` |

### `email.service.js`
| Function | Parameters | External |
|----------|-----------|----------|
| `generateOTP` | none | `Math.random()` |
| `sendOTPEmail` | `email, otp` | Gmail SMTP via nodemailer |
| `buildTaskNotificationEmailData` | `{ recipientUser, task, assignedByUser, dashboardUrl }` | Builds email payload from template |
| `sendTaskNotificationEmail` | `emailData` | Gmail SMTP via nodemailer |

---

## 📊 Database Models

### User Model (`src/models/User.js`)
```
{
  email: String (unique, required, lowercase),
  password: String (hashed, required, min 6),
  name: String (required, min 2),
  role: String (user|manager|admin, default: user),
  teamMembers: [ObjectId] → ref: User,
  isVerified: Boolean (default: false),
  otp: String (null after verification),
  otpExpiry: Date (null after verification),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Task Model (`src/models/Task.js`)
```
{
  userId: ObjectId (required) → ref: User,
  title: String (required, max 200),
  description: String (optional),
  status: String (pending|in_progress|completed, default: pending),
  priority: String (low|medium|high, default: medium),
  dueDate: Date (optional),
  attachmentUrl: String (optional),
  createdBy: ObjectId (optional) → ref: User (admin who created on behalf),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### EmailLog Model (`src/models/EmailLog.js`)
```
{
  recipientEmail: String (required),
  recipientName: String,
  subject: String,
  templateName: String,
  taskId: ObjectId → ref: Task,
  status: String (SUCCESS|FAILED),
  errorMessage: String (null on success),
  sentAt: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## 🔑 Key Concepts

### JWT Token Structure
```
Header: { alg: "HS256", typ: "JWT" }
Payload: { userId, email, role, iat, exp }
Signature: HMAC-SHA256(header.payload, JWT_SECRET)
```

### Error Handling
- **400 Bad Request**: Validation errors, invalid input, business rule violations
- **401 Unauthorized**: Missing/invalid token
- **403 Forbidden**: Valid token but insufficient permissions, unverified email
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource already exists (e.g., duplicate email)
- **500 Internal Server Error**: Email send failure, server-side errors

### Role-Based Access Control (RBAC)
- **User**: Can only access own tasks
- **Manager**: Can access own tasks + team members' tasks
- **Admin**: Can access all tasks and users, admin routes, create tasks for any user

### Email Notification Architecture
```
Admin creates task for user
    ↓
Task saved to MongoDB (Tasks collection)
    ↓
sendTaskNotification() called (non-blocking try/catch)
    ↓
buildTaskNotificationEmailData() → builds HTML email from template
    ↓
sendTaskNotificationEmail() → Gmail SMTP via nodemailer
    ↓
logEmailAttempt() → EmailLog.create() → saved to MongoDB (EmailLogs collection)
    ↓
Task creation response returned regardless of email outcome
```

---

## 🚀 Environment Variables Required
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmaster
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (used in email notification links)
FRONTEND_URL=http://localhost:5173
```

---

## 📝 Complete Registration + Login Flow

```
1. POST /api/v1/auth/register
   Body: { name, email, password }
   → validate.middleware → auth.controller → auth.service → User.create + sendOTPEmail
   Response: 201 { message, email, requiresVerification: true }

2. POST /api/v1/auth/verify-otp
   Body: { email, otp }
   → auth.controller → auth.service → user.save + jwt.sign
   Response: 200 { message, user, token }

3. POST /api/v1/auth/login (subsequent logins)
   Body: { email, password }
   → validate.middleware → auth.controller → auth.service → bcrypt.compare + jwt.sign
   Response: 200 { message, user, token }

4. GET /api/v1/tasks (authenticated request)
   Headers: Authorization: Bearer <token>
   → auth.middleware → task.controller → task.service → Task.find
   Response: 200 { tasks }

5. POST /api/v1/admin/tasks (admin creates task for user)
   Headers: Authorization: Bearer <admin_token>
   Body: { userId, title, description, status, priority, due_date }
   → auth.middleware → role.middleware (isAdmin) → admin.controller → admin.service
   → Task.create + sendTaskNotificationEmail + EmailLog.create
   Response: 201 { message, task, emailSent, emailStatus }