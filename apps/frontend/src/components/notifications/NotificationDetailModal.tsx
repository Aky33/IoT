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
};

export function NotificationDetailModal({
  notification,
  isOpen = false,
  userRole,
  onClose,
  onOpenDeviceDetail,
}: NotificationDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {notification && (
        <div className="stack">
          <div className="modal-header">
            <h3>Notification detail</h3>
            <p>
              <NotificationBadge type={notification.type} status={notification.status} />
            </p>
          </div>
          <dl className="kv">
            <dt>Device</dt>
            <dd>{notification.deviceName}</dd>
            <dt>Created</dt>
            <dd>{new Date(notification.createdAt).toLocaleString()}</dd>
          </dl>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {userRole === "admin" && onOpenDeviceDetail ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onOpenDeviceDetail(notification.deviceId)}
              >
                Open device
              </button>
            ) : null}
          </div>
        </div>
      )}
    </Modal>
  );
}
