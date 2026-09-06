import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';

const app = express();
const httpServer = createServer(app);

// Trust reverse proxy (essential for Render / Heroku / AWS ELB for secure cookies and accurate IPs)
app.set('trust proxy', 1);

// Normalize allowed origins and dynamic CORS validation
const normalizeOrigin = (url) => (url ? url.replace(/\/+$/, '') : '');
const allowedOrigins = [
  normalizeOrigin(env.CLIENT_URL),
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'https://instique.vercel.app',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);
    const isExplicitlyAllowed = allowedOrigins.includes(normalizedOrigin);
    // Allow any Vercel preview or branch deployment of instique
    const isVercelPreview = /^https:\/\/instique[a-zA-Z0-9-]*\.vercel\.app$/.test(normalizedOrigin);

    if (isExplicitlyAllowed || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
};

// app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
// app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(express.static('public'));

import authRoutes from './routes/auth.routes.js';
import schoolRoutes from './routes/school.routes.js';
import academicRoutes from './routes/academic.routes.js';
import studentRoutes from './routes/student.routes.js';
import admissionRoutes from './routes/admission.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import parentRoutes from './routes/parent.routes.js';
import timetableRoutes from './routes/timetable.routes.js';
import timetableConfigRoutes from './routes/timetableConfig.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import homeworkRoutes from './routes/homework.routes.js';
import examRoutes from './routes/exam.routes.js';
import feeRoutes from './routes/fee.routes.js';
import noticeRoutes from './routes/notice.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import eventRoutes from './routes/event.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import recognitionRoutes from './routes/recognition.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import syllabusRoutes from './routes/syllabus.routes.js';
import roleRoutes from './routes/role.routes.js';
import saasRoutes from './routes/saas.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import settingRoutes from './routes/setting.routes.js';
import bulkImportRoutes from './routes/bulkImport.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import auditRoutes from './routes/audit.routes.js';
import substitutionRoutes from './routes/substitution.routes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/academic', academicRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/admissions', admissionRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/parents', parentRoutes);
app.use('/api/v1/timetables', timetableRoutes);
app.use('/api/v1/timetable-configs', timetableConfigRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/homework', homeworkRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/substitutions', substitutionRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/recognition', recognitionRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/syllabus', syllabusRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/saas', saasRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/dashboards', dashboardRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/bulk-import', bulkImportRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Instique API is running', timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

// initializeSocket(httpServer);

export { httpServer, app };
// Trigger reload
