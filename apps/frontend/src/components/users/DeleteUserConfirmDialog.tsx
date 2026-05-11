import type { User } from "../../types/user";

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
  if (!isOpen || !user) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal panel stack">
        <h3>Delete patient</h3>
        <p>Are you sure you want to delete <strong>{user.name}</strong>?</p>
        {error ? <p role="alert">{error}</p> : null}
        <div className="row">
          <button disabled={isDeleting} onClick={() => onConfirm(user.id)}>
            Delete
          </button>
          <button type="button" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
