import type { Notification } from "../../types/notification";
import type { UserRole } from "../../types/common";
import { NotificationBadge } from "./NotificationBadge";
import { Modal } from "../common/Modal";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="stack">
      {notification && (
        <>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3>Notification detail</h3>
            <button type="button" onClick={onClose}>Close</button>
          </div>
          <NotificationBadge type={notification.type} status={notification.status} />
          <p>Device: {notification.deviceName}</p>
          <p>Created: {new Date(notification.createdAt).toLocaleString()}</p>
          <div className="row">
            {userRole === "admin" && onOpenDeviceDetail ? (
              <button type="button" onClick={() => onOpenDeviceDetail(notification.deviceId)}>Open device</button>
            ) : null}
          </div>
        </>
      )}
    </Modal>
  );
}
