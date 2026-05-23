import type { Device } from "../../types/device";
import { Modal } from "../common/Modal";

type DeleteDeviceConfirmDialogProps = {
  device: Device | null;
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: (deviceId: string) => void;
  isDeleting?: boolean;
  error?: string | null;
};

export function DeleteDeviceConfirmDialog({
  device,
  isOpen = false,
  onClose,
  onConfirm,
  isDeleting = false,
  error = null,
}: DeleteDeviceConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="stack">
      {device && (
        <>
          <div className="modal-header">
            <h3>Delete device</h3>
            <p>
              You are about to delete <strong>{device.name}</strong>. This action cannot be undone.
            </p>
          </div>
          {error ? <p role="alert" className="text-danger text-sm">{error}</p> : null}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" disabled={isDeleting} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={isDeleting}
              onClick={() => onConfirm(device.id)}
            >
              {isDeleting ? "Deleting…" : "Confirm delete"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
