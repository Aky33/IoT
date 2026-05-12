type DoNotDisturbWarningProps = {
  pushEnabled: boolean;
  compact?: boolean;
};

export function DoNotDisturbWarning({ pushEnabled, compact = false }: DoNotDisturbWarningProps) {
  if (pushEnabled) return null;

  if (compact) {
    return (
      <p className="panel banner banner-warning">
        <strong>Push notifikace vypnuté</strong> — urgentní alerty nebudou doručeny, pokud nemáte aplikaci otevřenou.
      </p>
    );
  }

  return (
    <div className="panel banner banner-warning">
      <strong>Push notifikace nejsou aktivní</strong>
      <p>Bez push notifikací nebudete upozorněni na urgentní alerty, když nemáte aplikaci otevřenou.</p>
      <p><small>Zapněte push notifikace v nastavení výše, nebo povolte notifikace v prohlížeči.</small></p>
    </div>
  );
}
