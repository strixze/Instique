# Instique — School ERP System

A production-grade, multi-tenant School ERP web application built with React, Node.js, Express, and MongoDB.

## Tech Stack

- **Frontend:** React (JavaScript), Vite, Tailwind CSS, Zustand, React Router v6+
- **Backend:** Node.js, Express, MongoDB (Mongoose ODM)
- **Auth:** JWT (access + refresh tokens), bcrypt
- **Real-time:** Socket.io
- **Charts:** Recharts
- **Icons:** lucide-react

## Features — 29 Modules

1. Authentication & User Management
2. School Management
3. Student Information System
4. Admission Management
5. Teacher Management
6. Academic Structure
7. Smart Timetable Management (flagship)
8. Attendance
9. Homework Management
10. Examination & Results
11. Fee Management
12. Notice Board
13. Leave Management
14. Events & Academic Calendar
15. Parent Meeting Management
16. Notifications (real-time)
17. Reports & Analytics
18. Excel Import & Export
19. Bulk Operations
20. Custom Roles & Permissions
21. Student Recognition & Achievements
22. Complaint & Feedback
23. Parent Portal
24. Curriculum / Syllabus Progress
25. Offline Support
26. Audit Logs
27. Role-specific Dashboards (5 roles)
28. Settings
29. SaaS Management

## Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas (or local MongoDB)

### Environment Variables

Copy the sample env files:

```bash
cp server/.env.sample server/.env
cp client/.env.sample client/.env
```

Edit `server/.env` with your MongoDB connection string and JWT secrets.

### Install Dependencies

```bash
npm run install:all
```

### Seed Demo Data

```bash
npm run seed
```

### Run Development

```bash
npm run dev
```

This starts both the server (port 5000) and client (port 5173) concurrently.

### Build for Production

```bash
npm run build
npm start
```

## Demo Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@instique.com | password123 |
| School Admin | schooladmin@springfield.edu | password123 |
| Teacher | teacher1@springfield.edu | password123 |
| Student | student1@springfield.edu | password123 |
| Parent | parent1@springfield.edu | password123 |

## API Structure

Base path: `/api/v1`

Standard response format:
```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "meta": { "page": 1, "limit": 10, "total": 100 }
}
```

## Project Structure

```
server/
├── config/          # DB, env, logger, socket config
├── models/          # Mongoose schemas (26 models)
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/          # Express routes
├── middlewares/     # Auth, RBAC, validation, error handling
├── validators/      # Zod schemas
├── utils/           # Helpers, pagination, timetable engine
├── jobs/            # Background jobs
├── seed/            # Demo data generator
└── sockets/         # Socket.io handlers

client/
├── src/
│   ├── api/         # Axios service layer
│   ├── components/  # UI components, layout, charts
│   ├── pages/       # Role-based pages
│   ├── routes/      # App routing
│   ├── store/       # Zustand stores
│   ├── hooks/       # Custom hooks
│   ├── context/     # React contexts
│   ├── utils/       # Utilities
│   ├── constants/   # Constants
│   ├── styles/      # Tailwind CSS
│   └── offline/     # Service worker, IndexedDB
```
# Instique
