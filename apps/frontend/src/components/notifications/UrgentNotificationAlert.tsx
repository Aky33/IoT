import type { Notification } from "../../types/notification";
import type { UserRole } from "../../types/common";

type UrgentNotificationAlertProps = {
  notification: Notification;
  userRole: UserRole;
  onOpenDetail?: (notificationId: string) => void;
  onOpenDeviceDetail?: (deviceId: string) => void;
  isProcessing?: boolean;
};

export function UrgentNotificationAlert({
  notification,
  userRole,
  onOpenDetail,
  onOpenDeviceDetail,
    isProcessing: _isProcessing = false
}: UrgentNotificationAlertProps) {
  if (!(notification.type === "urgent" && notification.status === "pending")) {
    return null;
  }

  return (
    <section className="panel card-strong stack">
      <h3>Urgent alert</h3>
      <p>{notification.deviceName}</p>
      <div className="row">
        {onOpenDetail ? <button onClick={() => onOpenDetail(notification.id)}>Detail</button> : null}
        {userRole === "admin" && onOpenDeviceDetail ? (
          <button onClick={() => onOpenDeviceDetail(notification.deviceId)}>Device</button>
        ) : null}
      </div>
    </section>
  );
}
