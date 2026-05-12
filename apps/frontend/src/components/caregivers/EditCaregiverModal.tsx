import type { Caregiver, CaregiverFormValues } from "../../lib/api";
import { CaregiverForm } from "./CaregiverForm";
import { Modal } from "../common/Modal";

type EditCaregiverModalProps = {
  caregiver: Caregiver | null;
  isOpen?: boolean;
  onClose: () => void;
  onUpdate: (caregiverId: string, values: CaregiverFormValues) => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export function EditCaregiverModal({
  caregiver,
  isOpen = false,
  onClose,
  onUpdate,
  isSubmitting = false,
  error = null,
}: EditCaregiverModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {caregiver && (
        <CaregiverForm
          initialValues={caregiver}
          onSubmit={(values) => onUpdate(caregiver.id, values)}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </Modal>
  );
}
