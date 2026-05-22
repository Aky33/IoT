import type { User } from "../../types/user";
import { Modal } from "../common/Modal";

type DeleteUserConfirmDialogProps = {
  user: User | null;
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => void;
  isDeleting?: boolean;
  error?: string | null;
};

export function DeleteUserConfirmDialog({
  user,
  isOpen = false,
  onClose,
  onConfirm,
  isDeleting = false,
  error = null,
}: DeleteUserConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="stack">
      {user && (
        <>
          <div className="modal-header">
            <h3>Delete patient</h3>
            <p>
              Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
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
              onClick={() => onConfirm(user.id)}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
