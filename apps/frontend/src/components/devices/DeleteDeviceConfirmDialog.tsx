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
  error = null
}: DeleteDeviceConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="stack">
      {device && (
        <>
          <h3>Delete device</h3>
          <p>You are deleting: {device.name}</p>
          {error ? <p role="alert">{error}</p> : null}
          <div className="row">
            <button type="button" disabled={isDeleting} onClick={() => onConfirm(device.id)}>
              Confirm delete
            </button>
            <button type="button" disabled={isDeleting} onClick={onClose}>
              Cancel
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
