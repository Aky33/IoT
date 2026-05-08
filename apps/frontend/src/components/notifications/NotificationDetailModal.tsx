import type { Notification } from "../../types/notification";
import type { UserRole } from "../../types/common";
import { NotificationBadge } from "./NotificationBadge";

type NotificationDetailModalProps = {
  notification: Notification | null;
  isOpen?: boolean;
  userRole: UserRole;
  onClose: () => void;
  onOpenDeviceDetail?: (deviceId: string) => void;
  isProcessing?: boolean;
};

export function NotificationDetailModal({
  notification,
  isOpen = false,
  userRole,
  onClose,
  onOpenDeviceDetail,
    isProcessing: _isProcessing = false
}: NotificationDetailModalProps) {
  if (!isOpen || !notification) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3>Notification detail</h3>
          <button onClick={onClose}>Close</button>
        </div>
        <NotificationBadge type={notification.type} status={notification.status} />
        <p>Device: {notification.deviceName}</p>
        <p>Created: {new Date(notification.createdAt).toLocaleString()}</p>
        <div className="row">
          {userRole === "admin" && onOpenDeviceDetail ? (
            <button onClick={() => onOpenDeviceDetail(notification.deviceId)}>Open device</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
