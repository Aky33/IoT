import type { Notification } from "../../types/notification";
import type { UserRole } from "../../types/common";
import { NotificationBadge } from "./NotificationBadge";

type NotificationItemProps = {
  notification: Notification;
  userRole: UserRole;
  onResolve?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onOpenDetail?: (notificationId: string) => void;
  onOpenDeviceDetail?: (deviceId: string) => void;
  isProcessing?: boolean;
};

export function NotificationItem({
  notification,
  userRole,
  onResolve,
  onDelete,
  onOpenDetail,
  onOpenDeviceDetail,
  isProcessing = false
}: NotificationItemProps) {
  const isUrgentPending = notification.type === "urgent" && notification.status === "pending";

  return (
    <article className="panel stack" style={isUrgentPending ? { borderColor: "#dc2626" } : undefined}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>{notification.deviceName}</strong>
        <NotificationBadge type={notification.type} status={notification.status} />
      </div>
      <small>{new Date(notification.createdAt).toLocaleString()}</small>
      <div className="row">
        {notification.status === "pending" && onResolve ? (
          <button disabled={isProcessing} onClick={() => onResolve(notification.id)}>
            Resolve
          </button>
        ) : null}
        {onOpenDetail ? <button onClick={() => onOpenDetail(notification.id)}>Detail</button> : null}
        {userRole === "admin" && onDelete ? (
          <button disabled={isProcessing} onClick={() => onDelete(notification.id)}>
            Delete
          </button>
        ) : null}
        {userRole === "admin" && onOpenDeviceDetail ? (
          <button onClick={() => onOpenDeviceDetail(notification.deviceId)}>Device</button>
        ) : null}
      </div>
    </article>
  );
}
