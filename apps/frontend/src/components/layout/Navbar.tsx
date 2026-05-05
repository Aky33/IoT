import type { UserRole } from "../../types/common";

type NavbarProps = {
  userRole: UserRole;
  activeRoute: string;
  onNavigate: (route: string) => void;
  notificationCount?: number;
  urgentNotificationCount?: number;
};

export function Navbar({
  userRole,
  activeRoute,
  onNavigate,
  notificationCount = 0,
  urgentNotificationCount = 0
}: NavbarProps) {
  const items = [
    { key: "/", label: "Dashboard" },
    { key: "/notifications", label: `Notifications (${notificationCount})` },
    { key: "/pair", label: "Pair Device" },
    { key: "/settings", label: "Settings" },
    ...(userRole === "admin" ? [{ key: "/admin/devices", label: "Admin Devices" }] : [])
  ];

  return (
    <nav className="navbar" aria-label="Main navigation">
      <strong>IoT Care</strong>
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
    </nav>
  );
}
