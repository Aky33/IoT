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
      <h3>Push notification settings</h3>
      <label>
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
