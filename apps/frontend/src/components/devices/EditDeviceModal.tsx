import type { Device, DeviceFormValues } from "../../types/device";
import type { User } from "../../types/user";
import type { Caregiver } from "../../lib/api";
import { DeviceForm } from "./DeviceForm";
import { Modal } from "../common/Modal";

type EditDeviceModalProps = {
  device: Device | null;
  isOpen?: boolean;
  users?: User[];
  caregivers?: Caregiver[];
  onClose: () => void;
  onUpdate: (deviceId: string, values: DeviceFormValues) => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export function EditDeviceModal({
  device,
  isOpen = false,
  users = [],
  caregivers = [],
  onClose,
  onUpdate,
  isSubmitting = false,
  error = null
}: EditDeviceModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {device && (
        <DeviceForm
          mode="edit"
          initialValues={device}
          users={users}
          caregivers={caregivers}
          onSubmit={(values) => onUpdate(device.id, values)}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </Modal>
  );
}
