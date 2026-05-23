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
  disabled = false,
}: DeviceFormProps) {
  const [values, setValues] = useState<DeviceFormValues>({
    name: initialValues.name ?? "",
    assignedUserId: initialValues.assignedUserId,
    caregiverId: initialValues.caregiverId,
  });

  const canSubmit = useMemo(
    () => Boolean(values.name.trim()) && !disabled && !isSubmitting,
    [values, disabled, isSubmitting],
  );

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          onSubmit(values);
        }
      }}
    >
      <div className="modal-header">
        <h3>{mode === "create" ? "Create device" : "Edit device"}</h3>
      </div>
      <label className="field">
        <span>Name</span>
        <input
          value={values.name}
          onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))}
          disabled={disabled || isSubmitting}
        />
      </label>
      {users.length > 0 ? (
        <label className="field">
          <span>Patient <span className="text-subtle">(optional)</span></span>
          <select
            value={values.assignedUserId ?? ""}
            onChange={(event) =>
              setValues((previous) => ({ ...previous, assignedUserId: event.target.value || undefined }))
            }
            disabled={disabled || isSubmitting}
          >
            <option value="">— Select —</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {caregivers.length > 0 ? (
        <label className="field">
          <span>Caregiver <span className="text-subtle">(optional)</span></span>
          <select
            value={values.caregiverId ?? ""}
            onChange={(event) =>
              setValues((previous) => ({ ...previous, caregiverId: event.target.value || undefined }))
            }
            disabled={disabled || isSubmitting}
          >
            <option value="">— Select —</option>
            {caregivers.map((caregiver) => (
              <option key={caregiver.id} value={caregiver.id}>
                {caregiver.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
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
