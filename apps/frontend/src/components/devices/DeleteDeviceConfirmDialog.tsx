import type { Device } from "../../types/device";

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
  if (!isOpen || !device) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal stack">
        <h3>Delete device</h3>
        <p>You are deleting: {device.name}</p>
        {error ? <p role="alert">{error}</p> : null}
        <div className="row">
          <button disabled={isDeleting} onClick={() => onConfirm(device.id)}>
            Confirm delete
          </button>
          <button disabled={isDeleting} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
