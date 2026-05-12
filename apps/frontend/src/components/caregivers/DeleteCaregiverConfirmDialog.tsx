import type { Caregiver } from "../../lib/api";
import { Modal } from "../common/Modal";

type DeleteCaregiverConfirmDialogProps = {
  caregiver: Caregiver | null;
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: (caregiverId: string) => void;
  isDeleting?: boolean;
  error?: string | null;
};

export function DeleteCaregiverConfirmDialog({
  caregiver,
  isOpen = false,
  onClose,
  onConfirm,
  isDeleting = false,
  error = null,
}: DeleteCaregiverConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="panel stack">
      {caregiver && (
        <>
          <h3>Delete caregiver</h3>
          <p>Are you sure you want to delete <strong>{caregiver.name}</strong>?</p>
          {error ? <p role="alert">{error}</p> : null}
          <div className="row">
            <button type="button" disabled={isDeleting} onClick={() => onConfirm(caregiver.id)}>
              Delete
            </button>
            <button type="button" onClick={onClose} disabled={isDeleting}>
              Cancel
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
