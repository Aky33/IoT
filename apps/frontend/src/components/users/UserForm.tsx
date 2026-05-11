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
      className="panel stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit(values);
      }}
    >
      <h3>{mode === "create" ? "Create patient" : "Edit patient"}</h3>
      <label>
        First name
        <input
          value={values.firstName}
          onChange={(e) => setValues((p) => ({ ...p, firstName: e.target.value }))}
          disabled={isSubmitting}
        />
      </label>
      <label>
        Last name
        <input
          value={values.lastName}
          onChange={(e) => setValues((p) => ({ ...p, lastName: e.target.value }))}
          disabled={isSubmitting}
        />
      </label>
      <label>
        Notes (optional)
        <textarea
          value={values.notes ?? ""}
          onChange={(e) => setValues((p) => ({ ...p, notes: e.target.value || undefined }))}
          disabled={isSubmitting}
          rows={3}
        />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <div className="row">
        <button type="submit" disabled={!canSubmit}>Save</button>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
      </div>
    </form>
  );
}
