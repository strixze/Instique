import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import ProtectedRoute from '../components/guards/ProtectedRoute';
import DashboardShell from '../components/layout/DashboardShell';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
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
import Complaints from '../pages/school-admin/Complaints';
import Roles from '../pages/school-admin/Roles';
import Settings from '../pages/school-admin/Settings';
import MarksEntry from '../pages/school-admin/MarksEntry';

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

function UnifiedTimetable() {
  const user = useUserStore((s) => s.user);
  if (user?.role === 'school_admin') return <Timetable />;
  if (user?.role === 'teacher') return <TeacherTimetable />;
  if (user?.role === 'student') return <StudentTimetable />;
  if (user?.role === 'parent') return <ParentTimetable />;
  return <Timetable />;
}

function ModulePage({ children }) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/students" element={<ModulePage><Students /></ModulePage>} />
      <Route path="/teachers" element={<ModulePage><Teachers /></ModulePage>} />
      <Route path="/admissions" element={<ModulePage><Admissions /></ModulePage>} />
      <Route path="/academic" element={<ModulePage><Academic /></ModulePage>} />
      <Route path="/timetable" element={<ModulePage><UnifiedTimetable /></ModulePage>} />
      <Route path="/timetable-config" element={<ModulePage><TimetableConfig /></ModulePage>} />
      <Route path="/attendance" element={<ModulePage><Attendance /></ModulePage>} />
      <Route path="/exams" element={<ModulePage><Exams /></ModulePage>} />
      <Route path="/marks-entry" element={<ModulePage><MarksEntry /></ModulePage>} />
      <Route path="/fees" element={<ModulePage><Fees /></ModulePage>} />
      <Route path="/notices" element={<ModulePage><Notices /></ModulePage>} />
      <Route path="/leaves" element={<ModulePage><Leaves /></ModulePage>} />
      <Route path="/complaints" element={<ModulePage><Complaints /></ModulePage>} />
      <Route path="/roles" element={<ModulePage><Roles /></ModulePage>} />
      <Route path="/settings" element={<ModulePage><Settings /></ModulePage>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
