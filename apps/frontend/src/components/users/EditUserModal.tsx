import type { User, UserFormValues } from "../../types/user";
import { UserForm } from "./UserForm";

type EditUserModalProps = {
  user: User | null;
  isOpen?: boolean;
  onClose: () => void;
  onUpdate: (userId: string, values: UserFormValues) => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export function EditUserModal({
  user,
  isOpen = false,
  onClose,
  onUpdate,
  isSubmitting = false,
  error = null,
}: EditUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <UserForm
          mode="edit"
          initialValues={user}
          onSubmit={(values) => onUpdate(user.id, values)}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      </div>
    </div>
  );
}
