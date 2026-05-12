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
  if (isLoading) return <LoadingState label="Loading device detail..." />;
  if (error) return <ErrorState message={error} />;
  if (!device) return <ErrorState message="Device not found." />;

  const assignedUser = users.find((u) => u.id === device.assignedUserId);
  const assignedCaregiver = caregivers.find((c) => c.id === device.caregiverId);

  return (
    <section className="page">
      <h2>{device.name}</h2>
      <section className="panel stack">
        <dl className="stack" style={{ gap: "0.3rem" }}>
          {assignedUser ? (
            <>
              <dt><strong>Patient</strong></dt>
              <dd>{assignedUser.name}</dd>
            </>
          ) : null}
          {assignedCaregiver ? (
            <>
              <dt><strong>Caregiver</strong></dt>
              <dd>{assignedCaregiver.name} ({assignedCaregiver.email})</dd>
            </>
          ) : null}
          <dt><strong>Created</strong></dt>
          <dd>{new Date(device.createdAt).toLocaleDateString()}</dd>
        </dl>
        {userRole === "admin" ? (
          <div className="row">
            {onEdit ? <button type="button" onClick={() => onEdit(device.id)}>Edit</button> : null}
            {onDelete ? <button type="button" onClick={() => onDelete(device.id)}>Delete</button> : null}
          </div>
        ) : null}
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
