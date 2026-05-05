import type { UserRole } from "../../types/common";

type StatusSummaryCardsProps = {
  activeDevicesCount?: number;
  offlineDevicesCount?: number;
  pendingNotificationsCount?: number;
  urgentNotificationsCount?: number;
  userRole: UserRole;
  onCardClick?: (cardType: string) => void;
};

export function StatusSummaryCards({
  activeDevicesCount = 0,
  offlineDevicesCount = 0,
  pendingNotificationsCount = 0,
  urgentNotificationsCount = 0,
  userRole,
  onCardClick
}: StatusSummaryCardsProps) {
  const cards = [
    { key: "activeDevices", label: "Active devices", value: activeDevicesCount },
    { key: "offlineDevices", label: "Offline devices", value: offlineDevicesCount, strong: offlineDevicesCount > 0 },
    { key: "pendingNotifications", label: "Pending notifications", value: pendingNotificationsCount, strong: pendingNotificationsCount > 0 },
    { key: "urgentNotifications", label: "Urgent notifications", value: urgentNotificationsCount, strongest: urgentNotificationsCount > 0 }
  ];

  return (
    <section className="grid-cards">
      {cards.map((card) => (
        <button
          key={card.key}
          className={`panel ${card.strongest ? "card-strong" : ""}`.trim()}
          onClick={() => onCardClick?.(card.key)}
        >
          <div className="stack">
            <strong>{card.label}</strong>
            <span>{card.value}</span>
            {card.strong && <small>Needs attention</small>}
            {userRole === "admin" && card.key === "activeDevices" ? <small>Admin metric</small> : null}
          </div>
        </button>
      ))}
    </section>
  );
}
