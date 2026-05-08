import { DoNotDisturbWarning } from "../components/notifications/DoNotDisturbWarning";
import { PushNotificationSettings } from "../components/notifications/PushNotificationSettings";
import { LedStatusLegend } from "../components/devices/LedStatusLegend";
import type { UserRole } from "../types/common";

type SettingsPageProps = {
  userRole: UserRole;
  pushEnabled?: boolean;
  doNotDisturb?: boolean;
  onTogglePush?: (value: boolean) => void;
  onToggleDoNotDisturb?: (value: boolean) => void;
};

export function SettingsPage({
  userRole,
  pushEnabled = true,
  doNotDisturb = false,
  onTogglePush,
  onToggleDoNotDisturb
}: SettingsPageProps) {
  return (
    <section className="page">
      <h2>Settings</h2>
      <p>Current role: {userRole}</p>
      <PushNotificationSettings
        enabled={pushEnabled}
        doNotDisturb={doNotDisturb}
        onToggleEnabled={onTogglePush}
        onToggleDoNotDisturb={onToggleDoNotDisturb}
      />
      <DoNotDisturbWarning isEnabled={doNotDisturb} />
      <LedStatusLegend />
    </section>
  );
}
