type DoNotDisturbWarningProps = {
  pushEnabled: boolean;
  compact?: boolean;
};

export function DoNotDisturbWarning({ pushEnabled, compact = false }: DoNotDisturbWarningProps) {
  if (pushEnabled) return null;

  if (compact) {
    return (
      <p className="banner banner-warning">
        <strong>Push notifikace vypnuté</strong> — urgentní alerty nebudou doručeny, pokud nemáte aplikaci otevřenou.
      </p>
    );
  }

  return (
    <div className="banner banner-warning">
      <span className="banner-title">Push notifikace nejsou aktivní</span>
      <span className="banner-text">
        Bez push notifikací nebudete upozorněni na urgentní alerty, když nemáte aplikaci otevřenou.
      </span>
      <small>Zapněte push notifikace v nastavení výše, nebo povolte notifikace v prohlížeči.</small>
    </div>
  );
}
