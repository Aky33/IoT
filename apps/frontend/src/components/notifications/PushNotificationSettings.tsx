type PushNotificationSettingsProps = {
  enabled?: boolean;
  onToggleEnabled?: (value: boolean) => void;
  disabled?: boolean;
};

export function PushNotificationSettings({
  enabled = false,
  onToggleEnabled,
  disabled = false,
}: PushNotificationSettingsProps) {
  return (
    <section className="panel stack">
      <div className="stack-tight">
        <h3>Push notifications</h3>
        <small className="text-muted">
          Receive alerts when a button is pressed, even with the app closed.
        </small>
      </div>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={enabled}
          disabled={disabled}
          onChange={(event) => onToggleEnabled?.(event.target.checked)}
        />
        Enable push notifications
      </label>
    </section>
  );
}
