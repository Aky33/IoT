import { useMemo, useState } from "react";
import type { UserFormValues } from "../../types/user";

type UserFormProps = {
  mode?: "create" | "edit";
  initialValues?: Partial<UserFormValues>;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export function UserForm({
  mode = "create",
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
}: UserFormProps) {
  const [values, setValues] = useState<UserFormValues>({
    firstName: initialValues.firstName ?? "",
    lastName: initialValues.lastName ?? "",
    notes: initialValues.notes ?? "",
  });

  const canSubmit = useMemo(
    () => Boolean(values.firstName.trim() && values.lastName.trim()) && !isSubmitting,
    [values, isSubmitting],
  );

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit(values);
      }}
    >
      <div className="modal-header">
        <h3>{mode === "create" ? "Create patient" : "Edit patient"}</h3>
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
        <span>Notes <span className="text-subtle">(optional)</span></span>
        <textarea
          value={values.notes ?? ""}
          onChange={(e) => setValues((p) => ({ ...p, notes: e.target.value || undefined }))}
          disabled={isSubmitting}
          rows={3}
        />
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
