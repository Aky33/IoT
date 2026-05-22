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
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="stack">
          <div className="modal-header">
            <h3>Invitation created</h3>
            <p>
              Share this code with the invitee. It expires on{" "}
              <strong>{new Date(created.expiresAt).toLocaleString()}</strong>.
            </p>
          </div>
          <label className="field">
            <span>Invitation code</span>
            <input
              className="text-mono"
              readOnly
              value={created.code}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </label>
          <p className="text-sm">
            Role: <strong>{created.role}</strong>
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await onCreate(role, ttlHours);
          if (result) setCreated(result);
        }}
      >
        <div className="modal-header">
          <h3>Create invitation</h3>
          <p>Generate a one-time code for a new caregiver or admin.</p>
        </div>
        <label className="field">
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="caregiver">Caregiver</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="field">
          <span>Expires in (hours)</span>
          <input
            type="number"
            min={1}
            max={720}
            value={ttlHours}
            onChange={(e) => setTtlHours(Number(e.target.value))}
          />
        </label>
        {error ? <p role="alert" className="text-danger text-sm">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create invitation"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
