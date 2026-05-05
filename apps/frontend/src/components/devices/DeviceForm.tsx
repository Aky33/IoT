import { useMemo, useState } from "react";
import type { DeviceFormValues } from "../../types/device";
import type { User } from "../../types/user";

type DeviceFormProps = {
  mode?: "create" | "edit";
  initialValues?: Partial<DeviceFormValues>;
  users?: User[];
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
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
  disabled = false
}: DeviceFormProps) {
  const [values, setValues] = useState<DeviceFormValues>({
    name: initialValues.name ?? "",
    serialNumber: initialValues.serialNumber ?? "",
    assignedUserId: initialValues.assignedUserId,
    location: initialValues.location,
    note: initialValues.note
  });

  const canSubmit = useMemo(
    () => Boolean(values.name.trim() && values.serialNumber.trim()) && !disabled && !isSubmitting,
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
      <input
        placeholder="Serial number"
        value={values.serialNumber}
        onChange={(event) => setValues((previous) => ({ ...previous, serialNumber: event.target.value }))}
        disabled={disabled || isSubmitting || mode === "edit"}
      />
      <select
        value={values.assignedUserId ?? ""}
        onChange={(event) => setValues((previous) => ({ ...previous, assignedUserId: event.target.value || undefined }))}
        disabled={disabled || isSubmitting || users.length === 0}
      >
        <option value="">Assign user</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      <input
        placeholder="Location"
        value={values.location ?? ""}
        onChange={(event) => setValues((previous) => ({ ...previous, location: event.target.value || undefined }))}
        disabled={disabled || isSubmitting}
      />
      <textarea
        placeholder="Note"
        value={values.note ?? ""}
        onChange={(event) => setValues((previous) => ({ ...previous, note: event.target.value || undefined }))}
        disabled={disabled || isSubmitting}
      />
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
