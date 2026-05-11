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
    <Modal isOpen={isOpen} onClose={onClose} className="panel stack">
      {user && (
        <>
          <h3>Delete patient</h3>
          <p>Are you sure you want to delete <strong>{user.name}</strong>?</p>
          {error ? <p role="alert">{error}</p> : null}
          <div className="row">
            <button type="button" disabled={isDeleting} onClick={() => onConfirm(user.id)}>
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
