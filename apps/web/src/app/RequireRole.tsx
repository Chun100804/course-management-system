import type { PropsWithChildren } from 'react';
import { USER_ROLES, type UserRole } from '@cms/shared';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

type RequireRoleProps = PropsWithChildren<{ allowedRoles: readonly UserRole[] }>;

export function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  const { user, isRestoring } = useAuth();
  if (isRestoring) return <main className="page notice">Đang xác thực phiên đăng nhập…</main>;
  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  if (!Object.values(USER_ROLES).includes(user.role) || !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children ?? <Outlet />;
}
