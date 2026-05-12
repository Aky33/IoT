import { useState } from "react";
import type { Invitation } from "../../lib/api";
import { Modal } from "../common/Modal";

type CreateInvitationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (role: string, ttlHours: number) => Promise<Invitation | undefined>;
  isSubmitting?: boolean;
  error?: string | null;
};

export function CreateInvitationModal({
  isOpen,
  onClose,
  onCreate,
  isSubmitting = false,
  error = null,
}: CreateInvitationModalProps) {
  const [role, setRole] = useState("caregiver");
  const [ttlHours, setTtlHours] = useState(24);
  const [created, setCreated] = useState<Invitation | null>(null);

  function handleClose() {
    setCreated(null);
    setRole("caregiver");
    setTtlHours(24);
    onClose();
  }

  if (created) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} className="panel stack">
        <h3>Invitation created</h3>
        <p>Share this code with the invitee. It expires on {new Date(created.expiresAt).toLocaleString()}.</p>
        <label>
          Invitation Code
          <input
            readOnly
            value={created.code}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </label>
        <p>
          Role: <strong>{created.role}</strong>
        </p>
        <button type="button" onClick={handleClose}>
          Close
        </button>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="panel stack">
      <h3>Create Invitation</h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await onCreate(role, ttlHours);
          if (result) setCreated(result);
        }}
        className="stack"
      >
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="caregiver">Caregiver</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          Expires in (hours)
          <input
            type="number"
            min={1}
            max={720}
            value={ttlHours}
            onChange={(e) => setTtlHours(Number(e.target.value))}
          />
        </label>
        {error ? <p role="alert" style={{ color: "var(--color-danger-border)" }}>{error}</p> : null}
        <div className="row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create"}
          </button>
          <button type="button" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
