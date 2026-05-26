# TaskMaster Pro

A backend REST API for multi user task management built with Node.js, Express, and MongoDB.

## Features

- ✅ User authentication (JWT)
- ✅ Create, read, update, delete tasks
- ✅ Task priorities (Low, Medium, High)
- ✅ Task statuses (Pending, In Progress, Completed)
- ✅ File attachments
- ✅ Task statistics
- ✅ Filter, search, and paginate tasks

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)
- bcrypt (password hashing)

## Project Structure

```
taskmaster-pro/
└── backend/
    ├── src/
    │   ├── config/         # MongoDB connection
    │   ├── middleware/     # Auth & error middleware
    │   ├── models/         # Mongoose models (User, Task)
    │   └── routes/         # API routes
    ├── uploads/            # File uploads
    ├── server.js
    ├── package.json
    └── .env.example
```

## Quick Start

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

npm install
npm run dev
```

Server runs on http://localhost:5000

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| GET | `/api/v1/auth/profile` | Get user profile (protected) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tasks` | Get all tasks (pagination, filters) |
| GET | `/api/v1/tasks/stats` | Get task statistics |
| GET | `/api/v1/tasks/:id` | Get single task |
| POST | `/api/v1/tasks` | Create task (supports file upload) |
| PUT | `/api/v1/tasks/:id` | Update task |
| DELETE | `/api/v1/tasks/:id` | Delete task |

### Query Parameters (GET /api/v1/tasks)
- `page` — page number (default: 1)
- `limit` — results per page (default: 10)
- `status` — filter by `pending`, `in_progress`, `completed`
- `priority` — filter by `low`, `medium`, `high`
- `search` — search in title and description
- `sort_by` — `createdAt`, `dueDate`, `priority`, `title`
- `sort_order` — `asc` or `desc`

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/taskmaster

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

## Deployment

### Backend (Render)
1. Create new Web Service
2. Connect GitHub repo
3. Set environment variables
4. Build command: `npm install`
5. Start command: `npm start`

### Database (MongoDB Atlas)
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get the connection string
3. Set `MONGODB_URI` in your environment variables

## License

MIT