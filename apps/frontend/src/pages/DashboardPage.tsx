import { StatusSummaryCards } from "../components/dashboard/StatusSummaryCards";
import { DeviceList } from "../components/devices/DeviceList";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { NotificationList } from "../components/notifications/NotificationList";
import { UrgentNotificationAlert } from "../components/notifications/UrgentNotificationAlert";
import type { UserRole } from "../types/common";
import type { PushPermissionState } from "../lib/api";
import type { DashboardSummary } from "../types/dashboard";
import type { Notification } from "../types/notification";
import type { Device } from "../types/device";

type DashboardPageProps = {
  userRole: UserRole;
  summary: DashboardSummary;
  latestNotifications?: Notification[];
  urgentNotifications?: Notification[];
  devices?: Device[];
  isLoading?: boolean;
  error?: string | null;
  pushPermission?: PushPermissionState;
  pushEnabled?: boolean;
  onEnablePush?: () => void;
};

export function DashboardPage({
  userRole,
  summary,
  latestNotifications = [],
  urgentNotifications = [],
  devices = [],
  isLoading = false,
  error = null,
  pushPermission = "default",
  pushEnabled = false,
  onEnablePush,
}: DashboardPageProps) {
  if (isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <section className="page">
      <h2>Dashboard</h2>
      {pushPermission === "default" && !pushEnabled ? (
        <div className="panel banner banner-info">
          <strong>Zapněte si notifikace</strong>
          <p>Bez povolených notifikací nebudete upozorněni na urgentní alerty, když nemáte aplikaci otevřenou.</p>
          {onEnablePush ? (
            <button type="button" onClick={onEnablePush}>Povolit notifikace</button>
          ) : null}
        </div>
      ) : null}

      {pushPermission === "denied" ? (
        <div role="alert" className="panel banner banner-danger">
          <strong>Notifikace jsou zablokované</strong>
          <p>Prohlížeč blokuje notifikace — můžete přijít o urgentní alerty.</p>
          <p><small>Klikněte na ikonu zámku 🔒 vlevo v adresním řádku → Oprávnění webu → Notifikace → Povolit.</small></p>
        </div>
      ) : null}

      <StatusSummaryCards {...summary} userRole={userRole} />
      {urgentNotifications[0] ? (
        <UrgentNotificationAlert
          notification={urgentNotifications[0]}
          userRole={userRole}
        />
      ) : null}
      {latestNotifications.length > 0 ? (
        <NotificationList notifications={latestNotifications} userRole={userRole} />
      ) : null}
      <DeviceList devices={devices} userRole={userRole} />
      {userRole === "admin" ? <section className="panel">Admin quick actions</section> : null}
    </section>
  );
}
