type PushNotificationSettingsProps = {
  enabled?: boolean;
  doNotDisturb?: boolean;
  onToggleEnabled?: (value: boolean) => void;
  onToggleDoNotDisturb?: (value: boolean) => void;
};

export function PushNotificationSettings({
  enabled = true,
  doNotDisturb = false,
  onToggleEnabled,
  onToggleDoNotDisturb
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
      <label>
        <input
          type="checkbox"
          checked={doNotDisturb}
          onChange={(event) => onToggleDoNotDisturb?.(event.target.checked)}
        />
        Do not disturb
      </label>
    </section>
  );
}
