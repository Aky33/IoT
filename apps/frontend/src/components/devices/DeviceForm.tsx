import { useMemo, useState } from "react";
import type { DeviceFormValues } from "../../types/device";
import type { User } from "../../types/user";
import type { Caregiver } from "../../lib/api";

type DeviceFormProps = {
  mode?: "create" | "edit";
  initialValues?: Partial<DeviceFormValues>;
  users?: User[];
  caregivers?: Caregiver[];
  onSubmit: (values: DeviceFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  disabled?: boolean;
};

export function DeviceForm({
  mode = "create",
  initialValues = {},
  users = [],
  caregivers = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
  disabled = false
}: DeviceFormProps) {
  const [values, setValues] = useState<DeviceFormValues>({
    name: initialValues.name ?? "",
    assignedUserId: initialValues.assignedUserId,
    caregiverId: initialValues.caregiverId,
  });

  const canSubmit = useMemo(
    () => Boolean(values.name.trim()) && !disabled && !isSubmitting,
    [values, disabled, isSubmitting]
  );

  return (
    <form
      className="panel stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          onSubmit(values);
        }
      }}
    >
      <h3>{mode === "create" ? "Create device" : "Edit device"}</h3>
      <input
        placeholder="Name"
        value={values.name}
        onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))}
        disabled={disabled || isSubmitting}
      />
      {users.length > 0 ? (
        <select
          value={values.assignedUserId ?? ""}
          onChange={(event) => setValues((previous) => ({ ...previous, assignedUserId: event.target.value || undefined }))}
          disabled={disabled || isSubmitting}
        >
          <option value="">Assign patient (optional)</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      ) : null}
      {caregivers.length > 0 ? (
        <select
          value={values.caregiverId ?? ""}
          onChange={(event) => setValues((previous) => ({ ...previous, caregiverId: event.target.value || undefined }))}
          disabled={disabled || isSubmitting}
        >
          <option value="">Assign caregiver (optional)</option>
          {caregivers.map((caregiver) => (
            <option key={caregiver.id} value={caregiver.id}>
              {caregiver.name}
            </option>
          ))}
        </select>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
      <div className="row">
        <button type="submit" disabled={!canSubmit}>
          Save
        </button>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
