import type { Notification } from "../../types/notification";
import type { UserRole } from "../../types/common";
import { NotificationBadge } from "./NotificationBadge";

type NotificationItemProps = {
  notification: Notification;
  userRole: UserRole;
  onOpenDetail?: (notificationId: string) => void;
  onOpenDeviceDetail?: (deviceId: string) => void;
};

export function NotificationItem({
  notification,
  userRole,
  onOpenDetail,
  onOpenDeviceDetail,
}: NotificationItemProps) {
  const isUrgentPending = notification.type === "urgent" && notification.status === "pending";

  return (
    <article className={`panel${isUrgentPending ? " card-strong" : ""}`}>
      <div className="item-row">
        <div className="item-row__main">
          <span className="item-row__title">
            {notification.deviceName}
            <NotificationBadge type={notification.type} status={notification.status} />
          </span>
          <span className="item-row__meta">
            {new Date(notification.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="item-row__actions">
          {onOpenDetail ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenDetail(notification.id)}
            >
              Detail
            </button>
          ) : null}
          {userRole === "admin" && onOpenDeviceDetail ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onOpenDeviceDetail(notification.deviceId)}
            >
              Device
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
