import type { Device, DeviceFormValues } from "../../types/device";
import type { User } from "../../types/user";
import { DeviceForm } from "./DeviceForm";

type EditDeviceModalProps = {
  device: Device | null;
  isOpen?: boolean;
  users?: User[];
  onClose: () => void;
  onUpdate: (deviceId: string, values: DeviceFormValues) => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export function EditDeviceModal({
  device,
  isOpen = false,
  users = [],
  onClose,
  onUpdate,
  isSubmitting = false,
  error = null
}: EditDeviceModalProps) {
  if (!isOpen || !device) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <DeviceForm
          mode="edit"
          initialValues={device}
          users={users}
          onSubmit={(values) => onUpdate(device.id, values)}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      </div>
    </div>
  );
}
