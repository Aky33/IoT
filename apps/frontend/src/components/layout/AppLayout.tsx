import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import type { UserRole } from "../../types/common";

type AppLayoutProps = {
  children: ReactNode;
  userRole: UserRole;
  activeRoute: string;
  onNavigate: (route: string) => void;
  sessionLabel?: string;
  onLogout?: () => void;
  notificationCount?: number;
  urgentNotificationCount?: number;
};

export function AppLayout({
  children,
  userRole,
  activeRoute,
  onNavigate,
  sessionLabel,
  onLogout,
  notificationCount = 0,
  urgentNotificationCount = 0
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Navbar
        userRole={userRole}
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        sessionLabel={sessionLabel}
        onLogout={onLogout}
        notificationCount={notificationCount}
        urgentNotificationCount={urgentNotificationCount}
      />
      <main>{children}</main>
    </div>
  );
}
