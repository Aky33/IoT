import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "../../types/common";

type ProtectedRouteProps = {
  allowedRoles: UserRole[];
  userRole?: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
};

export function ProtectedRoute({
  allowedRoles,
  userRole,
  children,
  fallback = null,
  redirectTo
}: ProtectedRouteProps) {
  const location = useLocation();

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (redirectTo) {
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
