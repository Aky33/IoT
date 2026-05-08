import type { DeviceFormValues } from "../../types/device";
import type { User } from "../../types/user";
import { DeviceForm } from "./DeviceForm";

type CreateDeviceModalProps = {
  isOpen?: boolean;
  users?: User[];
  onClose: () => void;
  onCreate: (values: DeviceFormValues) => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export function CreateDeviceModal({
  isOpen = false,
  users = [],
  onClose,
  onCreate,
  isSubmitting = false,
  error = null
}: CreateDeviceModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <DeviceForm
          mode="create"
          users={users}
          onSubmit={onCreate}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      </div>
    </div>
  );
}
