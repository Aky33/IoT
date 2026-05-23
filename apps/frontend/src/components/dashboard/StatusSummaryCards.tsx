type StatusSummaryCardsProps = {
  pendingNotificationsCount?: number;
  urgentNotificationsCount?: number;
};

export function StatusSummaryCards({
  pendingNotificationsCount = 0,
  urgentNotificationsCount = 0,
}: StatusSummaryCardsProps) {
  const cards = [
    {
      key: "pending",
      label: "Pending notifications",
      value: pendingNotificationsCount,
      highlight: pendingNotificationsCount > 0,
      urgent: false,
    },
    {
      key: "urgent",
      label: "Urgent notifications",
      value: urgentNotificationsCount,
      highlight: false,
      urgent: urgentNotificationsCount > 0,
    },
  ];

  return (
    <section className="grid-cards">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`panel ${card.urgent ? "card-strong metric-strong" : ""}`.trim()}
        >
          <div className="metric">
            <span className="metric-label">{card.label}</span>
            <span className="metric-value">{card.value}</span>
            {card.highlight && !card.urgent ? (
              <span className="metric-trend">Needs attention</span>
            ) : card.urgent ? (
              <span className="metric-trend text-danger">Respond immediately</span>
            ) : (
              <span className="metric-trend">All quiet</span>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
