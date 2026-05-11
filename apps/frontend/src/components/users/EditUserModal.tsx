import type { User, UserFormValues } from "../../types/user";
import { UserForm } from "./UserForm";
import { Modal } from "../common/Modal";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {user && (
        <UserForm
          mode="edit"
          initialValues={user}
          onSubmit={(values) => onUpdate(user.id, values)}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </Modal>
  );
}
