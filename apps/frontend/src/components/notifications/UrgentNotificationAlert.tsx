import type { Notification } from "../../types/notification";
import type { UserRole } from "../../types/common";

type UrgentNotificationAlertProps = {
  notification: Notification;
  userRole: UserRole;
  onAcknowledge?: (notificationId: string) => void;
  onResolve?: (notificationId: string) => void;
  onOpenDetail?: (notificationId: string) => void;
  onOpenDeviceDetail?: (deviceId: string) => void;
  isProcessing?: boolean;
};

export function UrgentNotificationAlert({
  notification,
  userRole,
  onAcknowledge,
  onResolve,
  onOpenDetail,
  onOpenDeviceDetail,
  isProcessing = false
}: UrgentNotificationAlertProps) {
  if (!(notification.type === "urgent" && notification.status === "pending")) {
    return null;
  }

  return (
    <section className="panel stack" style={{ borderColor: "#dc2626", borderWidth: 2 }}>
      <h3>Urgent alert</h3>
      <p>{notification.deviceName}</p>
      <div className="row">
        {onAcknowledge ? <button onClick={() => onAcknowledge(notification.id)}>Acknowledge</button> : null}
        {onResolve ? (
          <button disabled={isProcessing} onClick={() => onResolve(notification.id)}>
            Resolve
          </button>
        ) : null}
        {onOpenDetail ? <button onClick={() => onOpenDetail(notification.id)}>Detail</button> : null}
        {userRole === "admin" && onOpenDeviceDetail ? (
          <button onClick={() => onOpenDeviceDetail(notification.deviceId)}>Device</button>
        ) : null}
      </div>
    </section>
  );
}
