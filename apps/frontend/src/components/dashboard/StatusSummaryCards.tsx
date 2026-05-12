type StatusSummaryCardsProps = {
  pendingNotificationsCount?: number;
  urgentNotificationsCount?: number;
};

export function StatusSummaryCards({
  pendingNotificationsCount = 0,
  urgentNotificationsCount = 0,
}: StatusSummaryCardsProps) {
  const cards = [
    { key: "pending", label: "Pending notifications", value: pendingNotificationsCount, highlight: pendingNotificationsCount > 0 },
    { key: "urgent", label: "Urgent notifications", value: urgentNotificationsCount, urgent: urgentNotificationsCount > 0 },
  ];

  return (
    <section className="grid-cards">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`panel ${card.urgent ? "card-strong" : ""}`.trim()}
        >
          <div className="stack">
            <strong>{card.label}</strong>
            <span>{card.value}</span>
            {card.highlight && !card.urgent ? <small>Needs attention</small> : null}
          </div>
        </div>
      ))}
    </section>
  );
}
