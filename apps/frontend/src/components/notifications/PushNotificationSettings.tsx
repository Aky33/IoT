type PushNotificationSettingsProps = {
  enabled?: boolean;
  onToggleEnabled?: (value: boolean) => void;
};

export function PushNotificationSettings({
  enabled = true,
  onToggleEnabled,
}: PushNotificationSettingsProps) {
  return (
    <section className="panel stack">
      <h3>Push notification settings</h3>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggleEnabled?.(event.target.checked)}
        />
        Enable push notifications
      </label>
    </section>
  );
}
