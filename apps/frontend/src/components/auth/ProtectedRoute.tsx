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
  fallback,
  redirectTo
}: ProtectedRouteProps) {
  const location = useLocation();

  if (!userRole) {
    if (redirectTo) {
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
    return null;
  }

  if (!allowedRoles.includes(userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div role="alert" style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Access denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
