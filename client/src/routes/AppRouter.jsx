import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import ProtectedRoute from '../components/guards/ProtectedRoute';
import ProtectedRouteAuth from '../components/guards/ProtectedRouteAuth';
import DashboardShell from '../components/layout/DashboardShell';
import { ROUTE_PERMISSIONS, ROLES } from '../utils/rbac';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ActivateAccount from '../pages/auth/ActivateAccount';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import NotFound from '../pages/NotFound';

import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import SchoolAdminDashboard from '../pages/school-admin/Dashboard';
import TeacherDashboard from '../pages/teacher/Dashboard';
import StudentDashboard from '../pages/student/Dashboard';
import ParentDashboard from '../pages/parent/Dashboard';
import Students from '../pages/school-admin/Students';
import Teachers from '../pages/school-admin/Teachers';
import Admissions from '../pages/school-admin/Admissions';
import Academic from '../pages/school-admin/Academic';
import Timetable from '../pages/school-admin/Timetable';
import TimetableConfig from '../pages/school-admin/TimetableConfig';
import TeacherTimetable from '../pages/teacher/TeacherTimetable';
import StudentTimetable from '../pages/student/StudentTimetable';
import ParentTimetable from '../pages/parent/ParentTimetable';
import Attendance from '../pages/school-admin/Attendance';
import Exams from '../pages/school-admin/Exams';
import Fees from '../pages/school-admin/Fees';
import Notices from '../pages/school-admin/Notices';
import Leaves from '../pages/school-admin/Leaves';
import TeacherLeaves from '../pages/teacher/TeacherLeaves';
import Complaints from '../pages/school-admin/Complaints';
import Roles from '../pages/school-admin/Roles';
import Settings from '../pages/school-admin/Settings';
import MarksEntry from '../pages/school-admin/MarksEntry';
import Leaderboard from '../pages/school-admin/Leaderboard';
import Events from '../pages/school-admin/Events';
import AdminParentMeetings from '../pages/school-admin/ParentMeetings';
import TeacherParentMeetings from '../pages/teacher/ParentMeetings';
import ParentParentMeetings from '../pages/parent/ParentMeetings';
import ParentAttendance from '../pages/parent/ParentAttendance';
import Homework from '../pages/school-admin/Homework';
import Reports from '../pages/school-admin/Reports';
import StudentProfile from '../pages/school-admin/StudentProfile';
import TeacherProfile from '../pages/school-admin/TeacherProfile';
import SyllabusManagement from '../pages/school-admin/SyllabusManagement';
import SyllabusDetail from '../pages/school-admin/SyllabusDetail';
import SectionSyllabusTrackView from '../pages/teacher/SectionSyllabusTrackView';
import ParentSyllabusView from '../pages/parent/ParentSyllabusView';

function RoleDashboard() {
  const user = useUserStore((s) => s.user);
  const dashboards = {
    super_admin: SuperAdminDashboard,
    school_admin: SchoolAdminDashboard,
    teacher: TeacherDashboard,
    student: StudentDashboard,
    parent: ParentDashboard,
  };
  const Dashboard = dashboards[user?.role] || SchoolAdminDashboard;
  return <DashboardShell><Dashboard /></DashboardShell>;
}

function UnifiedParentMeetings() {
  const user = useUserStore((s) => s.user);
  if (user?.role === 'teacher') return <TeacherParentMeetings />;
  if (user?.role === 'parent') return <ParentParentMeetings />;
  return <AdminParentMeetings />;
}

function UnifiedTimetable() {
  const user = useUserStore((s) => s.user);
  if (user?.role === 'school_admin' || user?.role === 'super_admin') return <Timetable />;
  if (user?.role === 'teacher') return <TeacherTimetable />;
  if (user?.role === 'student') return <StudentTimetable />;
  if (user?.role === 'parent') return <ParentTimetable />;
  return <Timetable />;
}

function UnifiedAttendance() {
  const user = useUserStore((s) => s.user);
  if (user?.role === 'parent') return <ParentAttendance />;
  return <Attendance />;
}

function UnifiedLeaves() {
  const user = useUserStore((s) => s.user);
  if (user?.role === 'teacher') return <TeacherLeaves />;
  return <Leaves />;
}

function UnifiedSyllabus() {
  const user = useUserStore((s) => s.user);
  if (user?.role === 'parent') return <ParentSyllabusView />;
  return <SyllabusManagement />;
}

function ModulePage({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<ProtectedRouteAuth><Login /></ProtectedRouteAuth>} />
      <Route path="/register" element={<ProtectedRouteAuth><Register /></ProtectedRouteAuth>} />
      <Route path="/activate-account" element={<ActivateAccount />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Role Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={ROUTE_PERMISSIONS['/dashboard']}>
            <RoleDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin-Only Management Modules */}
      <Route path="/students" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/students']}><Students /></ModulePage>} />
      <Route path="/students/:studentId" element={<ModulePage allowedRoles={[ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.PARENT]}><StudentProfile /></ModulePage>} />
      <Route path="/teachers" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/teachers']}><Teachers /></ModulePage>} />
      <Route path="/teachers/:teacherId" element={<ModulePage allowedRoles={[ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER]}><TeacherProfile /></ModulePage>} />
      <Route path="/admissions" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/admissions']}><Admissions /></ModulePage>} />
      <Route path="/academic" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/academic']}><Academic /></ModulePage>} />
      <Route path="/timetable-config" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/timetable-config']}><TimetableConfig /></ModulePage>} />
      <Route path="/roles" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/roles']}><Roles /></ModulePage>} />
      <Route path="/settings" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/settings']}><Settings /></ModulePage>} />
      <Route path="/reports" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/reports']}><Reports /></ModulePage>} />

      {/* Shared Role Modules */}
      <Route path="/timetable" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/timetable']}><UnifiedTimetable /></ModulePage>} />
      <Route path="/attendance" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/attendance']}><UnifiedAttendance /></ModulePage>} />
      <Route path="/homework" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/homework']}><Homework /></ModulePage>} />
      <Route path="/syllabus" element={<ModulePage allowedRoles={[ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT]}><UnifiedSyllabus /></ModulePage>} />
      <Route path="/syllabus/:syllabusId" element={<ModulePage allowedRoles={[ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER]}><SyllabusDetail /></ModulePage>} />
      <Route path="/syllabus/tracks/:trackId" element={<ModulePage allowedRoles={[ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT]}><SectionSyllabusTrackView /></ModulePage>} />
      <Route path="/parent/syllabus" element={<ModulePage allowedRoles={[ROLES.PARENT, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN]}><ParentSyllabusView /></ModulePage>} />
      <Route path="/exams" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/exams']}><Exams /></ModulePage>} />
      <Route path="/marks-entry" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/marks-entry']}><MarksEntry /></ModulePage>} />
      <Route path="/leaderboard" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/leaderboard']}><Leaderboard /></ModulePage>} />
      <Route path="/fees" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/fees']}><Fees /></ModulePage>} />
      <Route path="/notices" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/notices']}><Notices /></ModulePage>} />
      <Route path="/events" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/events']}><Events /></ModulePage>} />
      <Route path="/parent-meetings" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/parent-meetings']}><UnifiedParentMeetings /></ModulePage>} />
      <Route path="/leaves" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/leaves']}><Leaves /></ModulePage>} />
      <Route path="/complaints" element={<ModulePage allowedRoles={ROUTE_PERMISSIONS['/complaints']}><Complaints /></ModulePage>} />

      {/* Common Route Aliases */}
      <Route path="/admission" element={<Navigate to="/admissions" replace />} />
      <Route path="/admin/admission" element={<Navigate to="/admissions" replace />} />
      <Route path="/admin/admissions" element={<Navigate to="/admissions" replace />} />
      <Route path="/admin/students" element={<Navigate to="/students" replace />} />
      <Route path="/admin/teachers" element={<Navigate to="/teachers" replace />} />
      <Route path="/admin/fees" element={<Navigate to="/fees" replace />} />
      <Route path="/admin/reports" element={<Navigate to="/reports" replace />} />
      <Route path="/admin/settings" element={<Navigate to="/settings" replace />} />
      <Route path="/admin/roles" element={<Navigate to="/roles" replace />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
