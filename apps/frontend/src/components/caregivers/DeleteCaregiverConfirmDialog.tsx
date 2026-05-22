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
    <Modal isOpen={isOpen} onClose={onClose} className="stack">
      {caregiver && (
        <>
          <div className="modal-header">
            <h3>Delete caregiver</h3>
            <p>
              Are you sure you want to delete <strong>{caregiver.name}</strong>? This action cannot be undone.
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
              onClick={() => onConfirm(caregiver.id)}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
