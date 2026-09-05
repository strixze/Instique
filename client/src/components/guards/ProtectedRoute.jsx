import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { hasRole } from '../../utils/rbac';

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = useUserStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.isActive === false) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(user, allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
