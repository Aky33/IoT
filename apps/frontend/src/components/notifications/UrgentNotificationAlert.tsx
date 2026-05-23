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
  isProcessing: _isProcessing = false,
}: UrgentNotificationAlertProps) {
  if (!(notification.type === "urgent" && notification.status === "pending")) {
    return null;
  }

  return (
    <section className="panel card-strong">
      <div className="item-row">
        <div className="item-row__main">
          <span className="item-row__title">
            <span className="dot dot-urgent" aria-hidden="true" />
            Urgent alert · {notification.deviceName}
          </span>
          <span className="item-row__meta">
            Pending response · {new Date(notification.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="item-row__actions">
          {onOpenDetail ? (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => onOpenDetail(notification.id)}
            >
              Open detail
            </button>
          ) : null}
          {userRole === "admin" && onOpenDeviceDetail ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenDeviceDetail(notification.deviceId)}
            >
              Device
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
