import { PushNotificationSettings } from "../components/notifications/PushNotificationSettings";
import { PushPermissionBanner } from "../components/notifications/PushPermissionBanner";
import { DoNotDisturbWarning } from "../components/notifications/DoNotDisturbWarning";
import type { UserRole } from "../types/common";
import type { PushPermissionState } from "../lib/api";

type SettingsPageProps = {
  userRole: UserRole;
  pushEnabled?: boolean;
  pushPermission?: PushPermissionState;
  onTogglePush?: (value: boolean) => void;
};

export function SettingsPage({ userRole, pushEnabled = false, pushPermission = "default", onTogglePush }: SettingsPageProps) {
  return (
    <section className="page">
      <h2>Settings</h2>
      <p>Current role: {userRole}</p>

      <PushPermissionBanner permission={pushPermission} pushEnabled={pushEnabled} />

      <PushNotificationSettings
        enabled={pushEnabled}
        onToggleEnabled={onTogglePush}
        disabled={pushPermission === "denied" || pushPermission === "unsupported"}
      />
      <DoNotDisturbWarning pushEnabled={pushEnabled} />
    </section>
  );
}
