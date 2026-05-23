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
    <article className="panel">
      <div className="item-row">
        <div className="item-row__main">
          <span className="item-row__title">{device.name}</span>
        </div>
        <div className="item-row__actions">
          <DeviceActionsMenu device={device} userRole={userRole} {...actions} />
        </div>
      </div>
    </article>
  );
}
