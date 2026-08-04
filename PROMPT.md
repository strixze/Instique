# Instique — School ERP: Full-Stack Build Prompt

You are building **Instique**, a complete, production-grade, multi-tenant School ERP web application, from scratch, end to end. You have full access to this codebase and complete context of this document. There are no reference images — every visual requirement below is described in words; interpret it faithfully and make expert design decisions where a specific value isn't given.

Do not build a partial scaffold, a demo, or a "starter template." Build every module listed below as a fully working feature: real database models, real API endpoints, real validation, real UI screens wired to real data, seeded with realistic demo data so the app is usable immediately after setup.

---

## 1. Tech Stack (fixed — do not substitute)

| Layer                  | Choice                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Frontend               | React (JavaScript, not TypeScript), Vite as the build tool                                                  |
| Backend                | Node.js + Express                                                                                           |
| Database               | MongoDB Atlas via Mongoose ODM                                                                              |
| Package manager        | npm only (`package-lock.json`, no yarn/pnpm)                                                                |
| Auth                   | JWT (access + refresh tokens)                                                                               |
| State management       | Redux Toolkit (or Zustand if you judge it cleaner — pick one and use it consistently everywhere, don't mix) |
| Routing                | React Router v6+                                                                                            |
| Styling                | Tailwind CSS + a small custom design-token layer (see §11)                                                  |
| Forms & validation     | react-hook-form + zod (frontend), express-validator or zod (backend)                                        |
| Charts                 | Recharts                                                                                                    |
| Icons                  | lucide-react                                                                                                |
| Tables                 | Custom data-table component (sortable, filterable, paginated) — build it once, reuse everywhere             |
| File uploads / Excel   | multer (uploads) + exceljs or xlsx (Excel import/export)                                                    |
| Notifications delivery | Socket.io for real-time in-app notifications                                                                |
| Offline support        | Service worker (Workbox or hand-rolled) + IndexedDB (idb library) for the offline-capable modules           |
| Logging                | winston (server logs) + morgan (HTTP request logs)                                                          |
| Security middleware    | helmet, cors, express-rate-limit, express-mongo-sanitize, bcrypt                                            |

---

## 2. Architecture Principles

- **Multi-tenant from day one.** Every school-scoped document (students, teachers, classes, fees, etc.) carries a `schoolId`. Every query on school-scoped data must be filtered by the authenticated user's `schoolId` at the service layer — never trust a `schoolId` passed in the request body/query for anything but Super Admin routes.
- **Layered backend.** Controllers only orchestrate: parse request → call service → shape response. All business logic lives in services. No Mongoose queries directly inside controllers or routes.
- **Consistent REST conventions** across all 29 modules (see §8) so the frontend API layer can be generated/reused rather than hand-written per module.
- **Role-based everything.** Every route, every UI element, every dashboard widget respects the 5 roles: Super Admin (Instique), School Admin, Teacher, Student, Parent. If a role shouldn't see or do something, it must be impossible via both the API (middleware-enforced) and the UI (not just hidden with CSS — actually gated at the route level).
- **No placeholder/mock data left in production code paths.** A `seed` script populates demo data for local development only; the running app always reads from MongoDB.

---

## 3. Backend Folder Structure (mandatory — follow exactly)

```
server/
├── config/
│   ├── db.js                  # MongoDB Atlas connection
│   ├── env.js                 # centralized, validated env access
│   ├── socket.js               # socket.io setup
│   └── logger.js              # winston config
├── models/
│   ├── User.js
│   ├── School.js
│   ├── Student.js
│   ├── Teacher.js
│   ├── Parent.js
│   ├── Admission.js
│   ├── AcademicYear.js
│   ├── SchoolClass.js
│   ├── Section.js
│   ├── Subject.js
│   ├── Timetable.js
│   ├── Attendance.js
│   ├── Homework.js
│   ├── Exam.js
│   ├── Mark.js
│   ├── FeeStructure.js
│   ├── FeeTransaction.js
│   ├── Notice.js
│   ├── Leave.js
│   ├── CalendarEvent.js
│   ├── ParentMeeting.js
│   ├── Notification.js
│   ├── Role.js
│   ├── RecognitionPoint.js
│   ├── Badge.js
│   ├── Complaint.js
│   ├── AuditLog.js
│   ├── Setting.js
│   └── Subscription.js
├── controllers/                # one file per module, mirrors models
├── routes/                     # one file per module, mounted under /api/v1
├── services/                   # business logic, one file per module
├── middlewares/
│   ├── auth.middleware.js       # verifies JWT
│   ├── rbac.middleware.js       # role + permission checks
│   ├── tenant.middleware.js     # injects/enforces schoolId scoping
│   ├── validate.middleware.js   # zod/express-validator error handling
│   ├── error.middleware.js      # centralized error handler
│   ├── upload.middleware.js     # multer config
│   └── rateLimiter.middleware.js
├── utils/
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── asyncHandler.js
│   ├── generateTokens.js
│   ├── excelParser.js
│   ├── excelExporter.js
│   ├── timetableEngine.js       # smart timetable generation algorithm
│   ├── substituteEngine.js      # substitute recommendation logic
│   └── pagination.js
├── jobs/                       # scheduled/background jobs (fee reminders, leave-driven substitute suggestions, notification digesting)
├── validators/                  # zod/express-validator schemas, one per module
├── seed/
│   └── seed.js                 # demo data generator
├── app.js
└── server.js
```

Every module (e.g. Attendance) follows this exact chain: `routes/attendance.routes.js` → `controllers/attendance.controller.js` → `services/attendance.service.js` → `models/Attendance.js`, with `validators/attendance.validator.js` used by `validate.middleware.js` before the controller runs.

---

## 4. Frontend Folder Structure (mandatory — follow exactly)

```
client/
├── src/
│   ├── api/                    # one file per module, axios instances + endpoint calls
│   ├── app/
│   │   ├── store.js             # Redux store (or Zustand root)
│   │   └── rootReducer.js
│   ├── features/               # redux slices (or zustand stores), one folder per module
│   ├── components/
│   │   ├── ui/                  # Button, Input, Select, Modal, Drawer, Tabs, Badge, DataTable, Card, Toast, EmptyState, Skeleton…
│   │   ├── layout/              # Sidebar, Topbar, DashboardShell, AuthLayout
│   │   └── charts/
│   ├── pages/
│   │   ├── auth/
│   │   ├── super-admin/
│   │   ├── school-admin/
│   │   ├── teacher/
│   │   ├── student/
│   │   └── parent/
│   ├── routes/
│   │   ├── AppRouter.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── roleRoutes.js
│   ├── hooks/
│   ├── context/                 # ThemeContext, SocketContext
│   ├── utils/
│   ├── constants/                # roles, permissions, module keys
│   ├── styles/                   # tailwind.css, design tokens
│   ├── offline/                  # service worker, IndexedDB sync logic
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

Pages are organized by role because each of the 5 roles gets its own dashboard shell and navigation — but they should share the same underlying `components/ui` library so the whole app feels like one product, not five.

---

## 5. Environment Variables

Create a `server/.env.sample` and a `client/.env.sample` (do not commit real `.env` files). Include every variable the app actually uses — at minimum:

**server/.env.sample**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:5173
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
MAX_UPLOAD_SIZE_MB=10
```

**client/.env.sample**
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## 6. Core Data Models (minimum required fields)

Design full Mongoose schemas yourself with proper types, refs, indexes, and timestamps. At minimum, model these entities and relationships:

- **School** — profile, branding (logo/colors), academic session, contact info, subscription reference
- **User** — email, password hash, role, schoolId (null for Super Admin), profile ref (Student/Teacher/Parent/SchoolAdmin), sessions[], lastLogin
- **Student** — personal info, class/section refs, parent refs, documents[], status (active/promoted/transferred/archived), admission ref
- **Teacher** — personal info, subject refs, class/section assignments, department, workload stats
- **Parent** — personal info, linked student refs (supports multiple children)
- **Admission** — applicant info, workflow status enum (submitted → document upload → verification → approved/rejected → fee paid → enrolled), documents[] each with status (uploaded/pending/verified/rejected)
- **AcademicYear / SchoolClass / Section / Subject** — structural hierarchy, all schoolId-scoped
- **Timetable** — periods per class/section/day, teacher+subject+room refs, generation metadata (auto-generated vs manually edited), constraint snapshot used to generate it
- **Attendance** — date, class/section, per-student status, marked-by, subject (for subject-wise), source (manual/bulk/offline-sync)
- **Homework** — class/section/subject, due date, attachments, template flag, submissions[] (optional)
- **Exam / Mark** — exam definition (subjects, passing criteria), marks per student per subject, computed grade/percentage
- **FeeStructure / FeeTransaction** — fee categories (admission/tuition/transport/custom), assignment rules, payment records (partial payments, discounts, scholarships, late fee calc), receipts
- **Notice** — scope (school/class), schedule, category, template flag
- **Leave** — requester, type (student/teacher), workflow status, linked substitute suggestion (for teacher leave)
- **CalendarEvent** — type enum (holiday/exam/event/PTM/sports day/annual day/deadline)
- **ParentMeeting** — schedule, assigned teacher, invited parents, notes, attendance
- **Notification** — recipient, type, read/unread, in-app payload
- **Role** — custom role name + module-level CRUD permission map
- **RecognitionPoint / Badge** — point value, category, awarding teacher, note, running total per student, badge criteria
- **Complaint** — type (student/parent), anonymous flag, status, resolution notes
- **AuditLog** — actor, action, entity, before/after snapshot, timestamp, IP
- **Setting** — per-school configurable values (grading scale, fee settings, notification toggles)
- **Subscription** — plan, trial dates, billing history, usage limits, status

---

## 7. Authentication & RBAC

- JWT access token (short-lived) + refresh token (httpOnly cookie), with a `/auth/refresh` endpoint and silent renewal on the frontend.
- 5 roles: `super_admin`, `school_admin`, `teacher`, `student`, `parent`. Super Admin has no `schoolId` and manages the platform (schools, subscriptions, platform analytics). All other roles are scoped to exactly one `schoolId`.
- Build `rbac.middleware.js` as `requireRole(...roles)` and `requirePermission(module, action)` for the **Custom Roles & Permissions** module (module 20) — School Admins can create custom roles with granular per-module CRUD permission maps that then gate access the same way the 5 built-in roles do.
- Password reset via signed, expiring token (email delivery can be stubbed/logged in dev, but the flow must be fully implemented).
- Every login/logout/failed-attempt writes to Login Activity (module 1) and feeds Audit Logs (module 26).

---

## 8. API Conventions

- Base path: `/api/v1`.
- Standard response envelope: `{ success, data, message, meta }` (meta carries pagination info).
- Errors go through a single `ApiError` class and `error.middleware.js` → consistent `{ success: false, message, errors[] }` shape with correct HTTP status codes.
- List endpoints support `?page=&limit=&sort=&search=&filter[field]=` — implement this once in `utils/pagination.js` and reuse across every module.
- Bulk-capable modules (Students, Attendance, Fees, Notifications, Class Allocation, User Creation — module 19) expose a `POST /bulk` endpoint accepting an array or an uploaded file.
- Excel-capable modules (module 18) expose `POST /:module/import` (multipart upload → parsed → validated row-by-row → partial-success report returned) and `GET /:module/export` (streams a generated .xlsx).

---

## 9. Feature Modules — Build All 29

Implement every module below as a complete vertical slice (model → service → controller → routes → validators → frontend API calls → Redux slice → UI pages/components), scoped correctly by role.

**01 — Authentication & User Management**: multi-role login, JWT, password reset, RBAC, profile management, session management (list/revoke active sessions), login activity log.

**02 — School Management**: school profile, academic session config, branding upload, contact info, subscription status view. School creation itself is Super-Admin-only (schools don't self-register).

**03 — Student Information System**: full student CRUD, admission workflow linkage, parent/guardian + emergency contacts, document uploads (Aadhaar, birth certificate, transfer certificate, previous report cards, medical docs, custom docs — stored via multer with type validation), promotion/transfer/archive workflows with status history, bulk import/promotion/class-allocation.

**04 — Admission Management**: online admission form; support both a native form and a "Google Forms → Excel import" path (import mapped rows into Admission + auto-create Student/Parent records); full workflow (submission → document upload → verification with uploaded/pending/verified/rejected states per document → approval/rejection → fee generation → payment → account creation → parent linking → class allocation).

**05 — Teacher Management**: profiles, subject/class assignment, department management, leave linkage, workload analytics (classes/day, weekly hours, free periods, workload distribution chart).

**06 — Academic Structure**: academic years, classes, sections, subjects, class teacher assignment, student/subject allocation — this is the structural backbone every other module references.

**07 — Smart Timetable Management (flagship — build this to a genuinely high standard, see §10)**: automatic generation + manual editing, conflict detection (teacher overlap, room overlap, subject weekly limits, room constraints), lunch breaks, holiday awareness, teacher preferences, workload balancing, publishing, and a substitute-management engine (automatic substitute assignment with a "best teacher" recommendation score based on availability + subject match + current workload).

**08 — Attendance**: daily + subject-wise marking, "mark all present" shortcut, bulk correction, reports, analytics dashboard, automatic parent notification on absence.

**09 — Homework Management**: creation with templates and "copy previous homework," attachments, due dates, optional student submission.

**10 — Examination & Results**: exam creation with subject selection and passing criteria, marks entry (manual + Excel import), automatic grade/percentage calculation, result publishing, report card generation (PDF), performance analytics.

**11 — Fee Management**: configurable fee structures (admission/tuition/transport/custom), assignment (individual + bulk), partial payments, discounts, scholarships, late fee calculation, receipt generation (PDF), due tracking, collection reports.

**12 — Notice Board**: school-wide + class-scoped notices, scheduling, templates, categories.

**13 — Leave Management**: student + teacher leave requests, approval workflow, history, automatic substitute recommendation triggered on approved teacher leave (feeds module 7's substitute engine).

**14 — Events & Academic Calendar**: single centralized calendar rendering holidays, exams, school events, PTMs, sports day, annual day, and deadlines, each with distinct visual treatment.

**15 — Parent Meeting Management**: PTM scheduling, teacher assignment, parent invitations (in-app + notification), meeting notes, attendance tracking.

**16 — Notifications**: in-app real-time notifications (Socket.io) covering attendance alerts, homework/fee reminders, leave updates, exam notifications, event reminders, plus admin-triggered bulk notifications.

**17 — Reports & Analytics**: cross-module report generation (attendance/fee/academic/student/teacher) with PDF and Excel export.

**18 — Excel Import & Export**: generalized import for students/teachers/fees/marks/timetables and export for attendance/fee reports/marks/student & teacher lists/reports — build one reusable import/export pipeline (see §8) and wire every applicable module into it.

**19 — Bulk Operations**: bulk promotion, class allocation, fee assignment, notifications, attendance corrections, and user creation — reuse the same bulk pipeline pattern across modules.

**20 — Custom Roles & Permissions**: School Admins define custom roles with per-module CRUD permission maps; assign users to them; enforced via `rbac.middleware.js`.

**21 — Student Recognition & Achievements**: teacher-awarded recognition points (configurable values, e.g. +1/+3/+5) with categories and notes, achievement badges (Star Student, Homework Hero, Perfect Attendance, Helpful Student, custom badges with configurable criteria), recognition history, leaderboards (attendance ranking, academic ranking), top performers, and class-to-class comparison analytics.

**22 — Complaint & Feedback**: student/parent complaints, optional anonymous submission, status tracking, resolution workflow.

**23 — Parent Portal**: a dedicated parent-facing surface aggregating attendance, results, homework, timetable, fee status, notices, recognition, and leave requests — with full multi-child support (switch between linked children).

**24 — Curriculum / Syllabus Progress**: subject syllabus definition, chapter-level tracking, completion percentage, teacher progress reports.

**25 — Offline Support**: attendance, timetable, and homework must remain usable without connectivity (service worker caching + IndexedDB queue) with automatic synchronization and conflict resolution when connectivity returns — surface sync status clearly in the UI.

**26 — Audit Logs**: immutable log of admission changes, attendance edits, fee updates, user activity, permission changes, login history, and general system activity — Super Admin and School Admin viewable, filterable, exportable.

**27 — Dashboards**: five distinct, role-specific dashboards —
- *Super Admin*: total schools, active subscriptions, revenue, trial schools, platform analytics.
- *School Admin*: student/teacher counts, today's attendance, pending fees, revenue summary, recent notices, admission applications, leave requests, upcoming events, timetable conflicts, teacher workload overview.
- *Teacher*: today's timetable, attendance pending, homework pending, upcoming exams, free periods, syllabus progress, recognition activity.
- *Student*: attendance, homework, timetable, fees, exam results, notices, recognition points, badges, leaderboard position.
- *Parent*: child overview (with switcher), attendance, homework, results, fees, timetable, notices, recognition, leave status.

**28 — Settings**: school profile, academic session, departments, subjects, grade settings, fee settings, notification settings, branding — centralized configuration screen for School Admins.

**29 — SaaS Management** (Super Admin only): school onboarding (create school → assign admin → activate subscription), subscription plan management, free trial handling, billing, payment history, usage limits enforcement (block/warn when a school exceeds its plan's limits).

---

## 10. Flagship Deep-Dive: Smart Timetable Engine

This is the feature the product is betting on — build it properly, not as a naive random assignment:

- Implement `utils/timetableEngine.js` as a constraint-based generator (backtracking with heuristics, or a greedy + local-repair approach — your choice, but it must actually respect hard constraints, not just avoid the most obvious clashes):
  - **Hard constraints (must never be violated):** no teacher double-booked at the same period, no room double-booked, subject weekly period limits respected, designated lunch break slots left free, holidays excluded entirely.
  - **Soft constraints (optimize for, can trade off):** teacher preferences (preferred periods/days), even workload distribution across the week per teacher.
- Provide a manual-editing UI (drag-and-drop grid) that re-runs conflict detection live and blocks/warns on any hard-constraint violation.
- Substitute engine (`utils/substituteEngine.js`): given a teacher absence, score eligible substitute teachers by subject match, current free-period availability at that slot, and current workload, and return a ranked recommendation list.
- Timetable must have a draft/published state — edits to a draft don't affect what students/parents/teachers currently see until published.

---

## 11. UI/UX Design System — "Premium ERP" Visual Direction

The product must read as a serious, expensive, enterprise-grade system — the visual bar is Linear, Stripe Dashboard, Vercel, or a well-funded modern ERP like Rippling/Deel, **not** a free Bootstrap admin template. Concretely:

- **Layout**: persistent left sidebar (icon + label, collapsible), sticky top bar (global search, notification bell with live unread count, role/user menu, school switcher for Super Admin), content area with breadcrumbs. Every role gets this same shell with a role-appropriate nav.
- **Density**: information-dense but never cluttered — generous internal padding inside cards/tables, tight padding at the page-grid level. This is a tool people use for hours a day; prioritize scanability over decoration.
- **Color system**: a single restrained primary color (a deep, trustworthy blue or indigo) for actions/active states, a neutral gray scale (not pure black/white) for structure and text, and a small set of semantic colors (success green, warning amber, danger red, info blue) used *only* for status — never decoratively. Avoid gradients, avoid multiple competing accent colors, avoid saturated "SaaS landing page" colors. Support light and dark mode.
- **Typography**: one clean sans-serif for UI text (e.g. Inter or Manrope) with a clear, restrained type scale (don't use more than 5–6 sizes across the whole app). Numbers in tables/dashboards use tabular figures.
- **Data tables**: sticky header, sortable columns, column-level filters, row density toggle, pagination, bulk-select with a contextual action bar, empty and loading states designed as first-class (not an afterthought), skeleton loaders instead of spinners for table/card content.
- **Dashboards**: KPI stat cards with a number, a label, and a small trend indicator; charts (Recharts) styled to match the palette — no default chart-library colors; every dashboard section should feel like it was designed for *this* data, not a generic template.
- **Forms**: clear field grouping, inline validation, disabled-state clarity, multi-step forms (e.g. Admission workflow) shown as a visible stepper.
- **Motion**: subtle, fast (150–200ms), used only for state transitions (drawer open, tab switch, toast in/out) — never decorative animation.
- **Consistency**: build the component library in `components/ui` once and use it everywhere; there should be zero one-off styled buttons/inputs/cards anywhere in the app.

The end result should feel like something a school would be proud to pay for — calm, precise, trustworthy — not flashy.

---

## 12. Cross-Cutting Technical Requirements

- Input validation and sanitization on every write endpoint (zod/express-validator + express-mongo-sanitize).
- Centralized error handling on both frontend (error boundary + toast surface) and backend (`error.middleware.js`).
- Rate limiting on auth endpoints specifically, plus a general API rate limit.
- Passwords hashed with bcrypt, never logged, never returned in any API response.
- Pagination, sorting, and search implemented once and reused, not duplicated per module.
- All list/detail screens implement loading, empty, and error states — no blank screens.
- Responsive down to tablet width at minimum (sidebar collapses to icon-only or drawer).
- `README.md` at the repo root documenting setup, environment variables, seed script usage, and how to run frontend + backend together.
- `seed/seed.js` creates: 1 sample school, all 5 role users with known demo credentials, a full academic structure, a generated timetable, several weeks of attendance/homework/marks history, fee records in various states, notices, recognition activity, and at least one open complaint — enough that every dashboard and every module has real data to show on first run.

---

## 13. Deliverables Checklist

- [ ] `server/` fully implemented per the folder structure in §3, all 29 modules working end to end
- [ ] `client/` fully implemented per the folder structure in §4, all 5 role dashboards and all 29 modules' UI wired to real API calls
- [ ] `server/.env.sample` and `client/.env.sample`
- [ ] `seed/seed.js` with realistic demo data, runnable via an npm script
- [ ] Root or per-package `README.md` with setup instructions
- [ ] `package.json` scripts: `npm run dev` (concurrently runs client + server in dev), `npm run seed`, `npm run build`, `npm start`
- [ ] No TODOs, no stubbed-out modules, no "coming soon" screens — every one of the 29 modules is fully functional

---

## 14. Suggested Build Order

1. Backend foundation: config, db connection, error/response utils, auth (module 1), School (module 2), RBAC middleware.
2. Academic Structure (module 6) — everything else references it.
3. Student/Teacher/Parent/Admission (modules 3, 4, 5).
4. Smart Timetable (module 7) — flagship, build early so downstream modules (attendance, homework, exams) can reference real timetable slots.
5. Attendance, Homework, Examination (modules 8–10).
6. Fee Management, Notice Board, Leave, Calendar, Parent Meetings, Notifications (modules 11–16).
7. Reports, Excel Import/Export, Bulk Operations, Custom Roles (modules 17–20).
8. Recognition, Complaints, Parent Portal, Curriculum (modules 21–24).
9. Offline Support, Audit Logs, Dashboards, Settings, SaaS Management (modules 25–29).
10. Frontend build proceeds in parallel per module once its API is stable; build `components/ui` and the dashboard shells first so every subsequent page reuses them.
11. Final pass: seed data, README, environment samples, end-to-end smoke test of every role's full workflow.