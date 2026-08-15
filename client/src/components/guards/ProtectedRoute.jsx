import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = useUserStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
