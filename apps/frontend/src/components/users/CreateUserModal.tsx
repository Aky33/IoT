import type { UserFormValues } from "../../types/user";
import { UserForm } from "./UserForm";

type CreateUserModalProps = {
  isOpen?: boolean;
  onClose: () => void;
  onCreate: (values: UserFormValues) => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export function CreateUserModal({
  isOpen = false,
  onClose,
  onCreate,
  isSubmitting = false,
  error = null,
}: CreateUserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <UserForm
          mode="create"
          onSubmit={onCreate}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      </div>
    </div>
  );
}
