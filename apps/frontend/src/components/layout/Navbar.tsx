import type { UserRole } from "../../types/common";

type NavbarProps = {
  userRole: UserRole;
  activeRoute: string;
  onNavigate: (route: string) => void;
  sessionLabel?: string;
  onLogout?: () => void;
  notificationCount?: number;
  urgentNotificationCount?: number;
};

export function Navbar({
  userRole,
  activeRoute,
  onNavigate,
  sessionLabel,
  onLogout,
  notificationCount = 0,
  urgentNotificationCount = 0
}: NavbarProps) {
  const items = [
    { key: "/", label: "Dashboard" },
    { key: "/notifications", label: `Notifications (${notificationCount})` },
    { key: "/settings", label: "Settings" },
    ...(userRole === "admin" ? [{ key: "/admin/devices", label: "Admin Devices" }] : [])
  ];

  return (
    <nav className="navbar" aria-label="Main navigation">
      <strong>IoT Care</strong>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div className="nav-items">
          {items.map((item) => (
            <button
              key={item.key}
              className={`nav-btn ${activeRoute === item.key ? "active" : ""}`.trim()}
              onClick={() => onNavigate(item.key)}
              style={item.key === "/notifications" && urgentNotificationCount > 0 ? { borderColor: "#dc2626" } : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="row" style={{ alignItems: "center" }}>
          {sessionLabel ? <small>{sessionLabel}</small> : null}
          {onLogout ? (
            <button className="nav-btn" onClick={onLogout}>
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
