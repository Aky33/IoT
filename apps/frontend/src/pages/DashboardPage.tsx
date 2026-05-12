import { StatusSummaryCards } from "../components/dashboard/StatusSummaryCards";
import { DeviceList } from "../components/devices/DeviceList";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { NotificationList } from "../components/notifications/NotificationList";
import { PushPermissionBanner } from "../components/notifications/PushPermissionBanner";
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
  onOpenDeviceDetail?: (deviceId: string) => void;
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
  onOpenDeviceDetail,
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
      <PushPermissionBanner permission={pushPermission} pushEnabled={pushEnabled} onEnablePush={onEnablePush} />

      <StatusSummaryCards {...summary} />
      {urgentNotifications[0] ? (
        <UrgentNotificationAlert
          notification={urgentNotifications[0]}
          userRole={userRole}
        />
      ) : null}
      {latestNotifications.length > 0 ? (
        <NotificationList notifications={latestNotifications} userRole={userRole} />
      ) : null}
      <DeviceList devices={devices} userRole={userRole} onOpenDetail={onOpenDeviceDetail} />
      {userRole === "admin" ? <section className="panel">Admin quick actions</section> : null}
    </section>
  );
}
