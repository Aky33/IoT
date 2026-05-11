import type { UserFormValues } from "../../types/user";
import { UserForm } from "./UserForm";
import { Modal } from "../common/Modal";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <UserForm
        mode="create"
        onSubmit={onCreate}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        error={error}
      />
    </Modal>
  );
}
