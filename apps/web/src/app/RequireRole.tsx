import type { PropsWithChildren } from 'react';
import type { UserRole } from '@cms/shared';
import { Navigate, Outlet } from 'react-router-dom';

type RequireRoleProps = PropsWithChildren<{
  currentRole: UserRole | null;
  allowedRoles: readonly UserRole[];
}>;

export function RequireRole({ children, currentRole, allowedRoles }: RequireRoleProps) {
  if (currentRole === null) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children ?? <Outlet />;
}
