import type { ReactNode } from "react";
import type { UserRole } from "../../types/common";

type RoleBasedActionProps = {
  allowedRoles: UserRole[];
  userRole?: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
};

export function RoleBasedAction({
  allowedRoles,
  userRole,
  children,
  fallback = null
}: RoleBasedActionProps) {
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
