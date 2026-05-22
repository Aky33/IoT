import type { UserRole } from "../types/common";
import type { Device } from "../types/device";
import type { Notification } from "../types/notification";
import type { User } from "../types/user";
import type { Caregiver } from "../lib/api";
import { NotificationList } from "../components/notifications/NotificationList";
import { DeviceButtonSimulator } from "../components/devices/DeviceButtonSimulator";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";

type DeviceDetailPageProps = {
  deviceId: string;
  device: Device | null;
  userRole: UserRole;
  notificationHistory?: Notification[];
  users?: User[];
  caregivers?: Caregiver[];
  isLoading?: boolean;
  error?: string | null;
  onEdit?: (deviceId: string) => void;
  onDelete?: (deviceId: string) => void;
};

export function DeviceDetailPage({
  deviceId,
  device,
  userRole,
  notificationHistory = [],
  users = [],
  caregivers = [],
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
}: DeviceDetailPageProps) {
  if (!deviceId) return null;
  if (isLoading) return <LoadingState label="Loading device detail…" />;
  if (error) return <ErrorState message={error} />;
  if (!device) return <ErrorState message="Device not found." />;

  const assignedUser = users.find((u) => u.id === device.assignedUserId);
  const assignedCaregiver = caregivers.find((c) => c.id === device.caregiverId);

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-header__title">
          <h2>{device.name}</h2>
          <p>Device details and recent activity.</p>
        </div>
        {userRole === "admin" ? (
          <div className="row">
            {onEdit ? (
              <button type="button" className="btn btn-secondary" onClick={() => onEdit(device.id)}>
                Edit
              </button>
            ) : null}
            {onDelete ? (
              <button type="button" className="btn btn-ghost text-danger" onClick={() => onDelete(device.id)}>
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </header>
      <section className="panel">
        <dl className="kv">
          {assignedUser ? (
            <>
              <dt>Patient</dt>
              <dd>{assignedUser.name}</dd>
            </>
          ) : null}
          {assignedCaregiver ? (
            <>
              <dt>Caregiver</dt>
              <dd>
                {assignedCaregiver.name} · <span className="text-muted">{assignedCaregiver.email}</span>
              </dd>
            </>
          ) : null}
          <dt>Created</dt>
          <dd>{new Date(device.createdAt).toLocaleDateString()}</dd>
        </dl>
      </section>
      {userRole === "admin" ? (
        <DeviceButtonSimulator deviceId={device.id} deviceName={device.name} />
      ) : null}
      {notificationHistory.length > 0 ? (
        <NotificationList notifications={notificationHistory} userRole={userRole} />
      ) : null}
    </section>
  );
}
