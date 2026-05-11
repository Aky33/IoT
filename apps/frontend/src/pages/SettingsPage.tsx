import { PushNotificationSettings } from "../components/notifications/PushNotificationSettings";
import { LedStatusLegend } from "../components/devices/LedStatusLegend";
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

      {pushPermission === "default" && !pushEnabled ? (
        <div className="panel" style={{ borderColor: "#2563eb", background: "#eff6ff", padding: "1rem" }}>
          <strong>Zapněte si notifikace</strong>
          <p>Bez povolených notifikací nebudete upozorněni na urgentní alerty, když nemáte aplikaci otevřenou.</p>
          <p><small>Klikněte na checkbox níže — prohlížeč se vás zeptá na povolení.</small></p>
        </div>
      ) : null}

      {pushPermission === "denied" ? (
        <div role="alert" className="panel" style={{ borderColor: "#b91c1c", background: "#fef2f2", padding: "1rem" }}>
          <strong>Notifikace jsou zablokované</strong>
          <p>Prohlížeč blokuje notifikace pro tuto stránku. Můžete přijít o urgentní alerty.</p>
          <p><small>Povolte notifikace v nastavení prohlížeče (ikona zámku v adresním řádku).</small></p>
        </div>
      ) : null}

      {pushPermission === "unsupported" ? (
        <div role="alert" className="panel" style={{ borderColor: "#f59e0b", background: "#fffbeb", padding: "1rem" }}>
          <strong>Push notifikace nejsou podporované</strong>
          <p>Tento prohlížeč nepodporuje Web Push. Notifikace budou fungovat pouze při otevřené aplikaci.</p>
        </div>
      ) : null}

      <PushNotificationSettings
        enabled={pushEnabled}
        onToggleEnabled={onTogglePush}
        disabled={pushPermission === "denied" || pushPermission === "unsupported"}
      />
      <LedStatusLegend />
    </section>
  );
}
