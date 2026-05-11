import { useState } from "react";
import type { DeviceFormValues } from "../../types/device";
import type { User } from "../../types/user";
import type { Caregiver, CreatedDevice } from "../../lib/api";
import { DeviceForm } from "./DeviceForm";
import { Modal } from "../common/Modal";

type CreateDeviceModalProps = {
  isOpen?: boolean;
  users?: User[];
  caregivers?: Caregiver[];
  onClose: () => void;
  onCreate: (values: DeviceFormValues) => Promise<CreatedDevice | undefined>;
  isSubmitting?: boolean;
  error?: string | null;
};

export function CreateDeviceModal({
  isOpen = false,
  users = [],
  caregivers = [],
  onClose,
  onCreate,
  isSubmitting = false,
  error = null
}: CreateDeviceModalProps) {
  const [created, setCreated] = useState<CreatedDevice | null>(null);

  if (created) {
    return (
      <Modal isOpen={isOpen} onClose={() => { setCreated(null); onClose(); }} className="panel stack">
        <h3>Device created</h3>
        <p>Save these credentials — the secret will not be shown again.</p>
        <label>
          Device ID
          <input readOnly value={created.id} onClick={(e) => (e.target as HTMLInputElement).select()} />
        </label>
        <label>
          Device Secret
          <input readOnly value={created.deviceSecret} onClick={(e) => (e.target as HTMLInputElement).select()} />
        </label>
        <button type="button" onClick={() => { setCreated(null); onClose(); }}>
          Close
        </button>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <DeviceForm
        mode="create"
        users={users}
        caregivers={caregivers}
        onSubmit={async (values) => {
          const result = await onCreate(values);
          if (result) setCreated(result);
        }}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        error={error}
      />
    </Modal>
  );
}
