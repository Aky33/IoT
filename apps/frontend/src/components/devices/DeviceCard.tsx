import type { Device } from "../../types/device";
import type { UserRole } from "../../types/common";
import { DeviceActionsMenu } from "./DeviceActionsMenu";

type DeviceCardProps = {
  device: Device;
  userRole: UserRole;
  onOpenDetail?: (deviceId: string) => void;
  onEdit?: (deviceId: string) => void;
  onDelete?: (deviceId: string) => void;
  isProcessing?: boolean;
};

export function DeviceCard({ device, userRole, ...actions }: DeviceCardProps) {
  return (
    <article className="panel stack">
      <strong>{device.name}</strong>
      <DeviceActionsMenu device={device} userRole={userRole} {...actions} />
    </article>
  );
}
