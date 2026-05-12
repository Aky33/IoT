import type { UserRole } from "../types/common";
import type { Device } from "../types/device";
import type { Notification } from "../types/notification";
import { DeviceStatusIndicator } from "../components/devices/DeviceStatusIndicator";
import { LedStatusPreview } from "../components/devices/LedStatusPreview";
import { NotificationList } from "../components/notifications/NotificationList";
import { DeviceButtonSimulator } from "../components/devices/DeviceButtonSimulator";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";

type DeviceDetailPageProps = {
  deviceId: string;
  device: Device | null;
  userRole: UserRole;
  notificationHistory?: Notification[];
  isLoading?: boolean;
  error?: string | null;
  onEdit?: (deviceId: string) => void;
  onDelete?: (deviceId: string) => void;
};

export function DeviceDetailPage({
  deviceId,
  device,
  userRole,
  notificationHistory = [],
  isLoading = false,
  error = null,
  onEdit,
    onDelete
}: DeviceDetailPageProps) {
  if (!deviceId) {
    return null;
  }

  if (isLoading) {
    return <LoadingState label="Loading device detail..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!device) {
    return <ErrorState message="Device not found." />;
  }

  return (
    <section className="page">
      <h2>{device.name}</h2>
      <section className="panel stack">
        <DeviceStatusIndicator status={device.status} lastSeenAt={device.lastSeenAt} />
        <LedStatusPreview status={device.ledStatus} description="Current LED state" />
        {userRole === "admin" ? (
          <div className="row">
            {onEdit ? <button onClick={() => onEdit(device.id)}>Edit</button> : null}
            {onDelete ? <button onClick={() => onDelete(device.id)}>Delete</button> : null}
          </div>
        ) : null}
      </section>
      {userRole === "admin" ? (
        <DeviceButtonSimulator deviceId={device.id} deviceName={device.name} />
      ) : null}
      {notificationHistory.length > 0 ? (
        <NotificationList notifications={notificationHistory} userRole={userRole} />
      ) : null}
    </section>
  );
}
