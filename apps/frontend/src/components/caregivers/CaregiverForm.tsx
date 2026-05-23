import { useMemo, useState } from "react";
import type { CaregiverFormValues } from "../../lib/api";

type CaregiverFormProps = {
  initialValues?: Partial<CaregiverFormValues>;
  onSubmit: (values: CaregiverFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export function CaregiverForm({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
}: CaregiverFormProps) {
  const [values, setValues] = useState<CaregiverFormValues>({
    firstName: initialValues.firstName ?? "",
    lastName: initialValues.lastName ?? "",
    email: initialValues.email ?? "",
    phone: initialValues.phone ?? "",
    role: initialValues.role ?? "caregiver",
  });

  const canSubmit = useMemo(
    () =>
      Boolean(values.firstName.trim() && values.lastName.trim() && values.email.trim()) &&
      !isSubmitting,
    [values, isSubmitting],
  );

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit({ ...values, phone: values.phone || undefined });
      }}
    >
      <div className="modal-header">
        <h3>Edit caregiver</h3>
      </div>
      <div className="field-row">
        <label className="field">
          <span>First name</span>
          <input
            value={values.firstName}
            onChange={(e) => setValues((p) => ({ ...p, firstName: e.target.value }))}
            disabled={isSubmitting}
          />
        </label>
        <label className="field">
          <span>Last name</span>
          <input
            value={values.lastName}
            onChange={(e) => setValues((p) => ({ ...p, lastName: e.target.value }))}
            disabled={isSubmitting}
          />
        </label>
      </div>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={values.email}
          onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
          disabled={isSubmitting}
        />
      </label>
      <label className="field">
        <span>Phone <span className="text-subtle">(optional)</span></span>
        <input
          type="tel"
          value={values.phone ?? ""}
          onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
          disabled={isSubmitting}
        />
      </label>
      <label className="field">
        <span>Role</span>
        <select
          value={values.role ?? "caregiver"}
          onChange={(e) => setValues((p) => ({ ...p, role: e.target.value }))}
          disabled={isSubmitting}
        >
          <option value="caregiver">Caregiver</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      {error ? <p role="alert" className="text-danger text-sm">{error}</p> : null}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {isSubmitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
