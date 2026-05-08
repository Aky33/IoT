import type { Device } from "../../types/device";
import type { UserRole } from "../../types/common";
import { DeviceList } from "../../components/devices/DeviceList";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";

type AdminDevicesPageProps = {
  devices?: Device[];
  userRole: UserRole;
  isLoading?: boolean;
  error?: string | null;
  onCreateDevice?: () => void;
  onEditDevice?: (deviceId: string) => void;
  onDeleteDevice?: (deviceId: string) => void;
  onOpenDeviceDetail?: (deviceId: string) => void;
};

export function AdminDevicesPage({
  devices = [],
  userRole,
  isLoading = false,
  error = null,
  onCreateDevice,
  onEditDevice,
  onDeleteDevice,
  onOpenDeviceDetail
}: AdminDevicesPageProps) {
  if (userRole !== "admin") {
    return <ErrorState message="Access denied." />;
  }

  return (
    <section className="page">
      <h2>Admin devices</h2>
      {onCreateDevice ? <button onClick={onCreateDevice}>Create device</button> : null}
      {isLoading ? <LoadingState label="Loading admin devices..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!isLoading && !error && devices.length === 0 ? <EmptyState title="No devices" /> : null}
      {!isLoading && !error && devices.length > 0 ? (
        <DeviceList
          devices={devices}
          userRole={userRole}
          onEdit={onEditDevice}
          onDelete={onDeleteDevice}
          onOpenDetail={onOpenDeviceDetail}
        />
      ) : null}
    </section>
  );
}
