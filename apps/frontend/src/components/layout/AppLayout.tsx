import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import type { UserRole } from "../../types/common";

type AppLayoutProps = {
  children: ReactNode;
  userRole: UserRole;
  activeRoute: string;
  onNavigate: (route: string) => void;
  notificationCount?: number;
  urgentNotificationCount?: number;
};

export function AppLayout({
  children,
  userRole,
  activeRoute,
  onNavigate,
  notificationCount = 0,
  urgentNotificationCount = 0
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Navbar
        userRole={userRole}
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        notificationCount={notificationCount}
        urgentNotificationCount={urgentNotificationCount}
      />
      <main>{children}</main>
    </div>
  );
}
