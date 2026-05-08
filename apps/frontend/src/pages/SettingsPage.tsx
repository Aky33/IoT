import { PushNotificationSettings } from "../components/notifications/PushNotificationSettings";
import { LedStatusLegend } from "../components/devices/LedStatusLegend";
import type { UserRole } from "../types/common";

type SettingsPageProps = {
  userRole: UserRole;
  pushEnabled?: boolean;
  onTogglePush?: (value: boolean) => void;
};

export function SettingsPage({ userRole, pushEnabled = true, onTogglePush }: SettingsPageProps) {
  return (
    <section className="page">
      <h2>Settings</h2>
      <p>Current role: {userRole}</p>
      <PushNotificationSettings enabled={pushEnabled} onToggleEnabled={onTogglePush} />
      <LedStatusLegend />
    </section>
  );
}
