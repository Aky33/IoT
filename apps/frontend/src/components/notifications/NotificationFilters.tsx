import type { Device } from "../../types/device";
import type { NotificationFilters as NotificationFiltersType } from "../../types/notification";
import type { UserRole } from "../../types/common";

type NotificationFiltersProps = {
  filters: NotificationFiltersType;
  devices: Device[];
  userRole: UserRole;
  onChange: (filters: NotificationFiltersType) => void;
  onReset?: () => void;
  isDisabled?: boolean;
};

export function NotificationFilters({
  filters,
  devices,
  onChange,
  onReset,
  isDisabled = false
}: NotificationFiltersProps) {
  const isActive = Object.values(filters).some(Boolean);

  return (
    <section className="panel row">
      <select
        disabled={isDisabled}
        value={filters.type ?? ""}
        onChange={(event) => onChange({ ...filters, type: (event.target.value as NotificationFiltersType["type"]) || undefined })}
      >
        <option value="">All types</option>
        <option value="standard">Standard</option>
        <option value="urgent">Urgent</option>
      </select>

      <select
        disabled={isDisabled}
        value={filters.status ?? ""}
        onChange={(event) => onChange({ ...filters, status: (event.target.value as NotificationFiltersType["status"]) || undefined })}
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="sent">Sent</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
        <option value="failed">Failed</option>
      </select>

      <select
        disabled={isDisabled || devices.length === 0}
        value={filters.deviceId ?? ""}
        onChange={(event) => onChange({ ...filters, deviceId: event.target.value || undefined })}
      >
        <option value="">All devices</option>
        {devices.map((device) => (
          <option key={device.id} value={device.id}>
            {device.name}
          </option>
        ))}
      </select>

      {isActive && onReset ? (
        <button type="button" onClick={onReset} disabled={isDisabled}>
          Reset
        </button>
      ) : null}
    </section>
  );
}
