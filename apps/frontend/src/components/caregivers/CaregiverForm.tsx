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
      className="panel stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit({ ...values, phone: values.phone || undefined });
      }}
    >
      <h3>Edit caregiver</h3>
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
        Email
        <input
          type="email"
          value={values.email}
          onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
          disabled={isSubmitting}
        />
      </label>
      <label>
        Phone (optional)
        <input
          type="tel"
          value={values.phone ?? ""}
          onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
          disabled={isSubmitting}
        />
      </label>
      <label>
        Role
        <select
          value={values.role ?? "caregiver"}
          onChange={(e) => setValues((p) => ({ ...p, role: e.target.value }))}
          disabled={isSubmitting}
        >
          <option value="caregiver">Caregiver</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <div className="row">
        <button type="submit" disabled={!canSubmit}>Save</button>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
      </div>
    </form>
  );
}
