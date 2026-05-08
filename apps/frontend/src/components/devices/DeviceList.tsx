import type { Device } from "../../types/device";
import type { UserRole } from "../../types/common";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { LoadingState } from "../common/LoadingState";
import { DeviceCard } from "./DeviceCard";

type DeviceListProps = {
  devices: Device[];
  userRole: UserRole;
  isLoading?: boolean;
  error?: string | null;
  onEdit?: (deviceId: string) => void;
  onDelete?: (deviceId: string) => void;
  onPair?: (deviceId: string) => void;
  onOpenDetail?: (deviceId: string) => void;
};

export function DeviceList({
  devices,
  userRole,
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
  onPair,
  onOpenDetail
}: DeviceListProps) {
  if (isLoading) {
    return <LoadingState label="Loading devices..." />;
  }
  if (error) {
    return <ErrorState message={error} />;
  }
  if (devices.length === 0) {
    return <EmptyState title="No devices" description="No device available." />;
  }

  return (
    <section className="stack">
      {devices.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          userRole={userRole}
          onOpenDetail={onOpenDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          onPair={onPair}
        />
      ))}
    </section>
  );
}
