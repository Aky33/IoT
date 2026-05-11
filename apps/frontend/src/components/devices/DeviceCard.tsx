import type { Device } from "../../types/device";
import type { UserRole } from "../../types/common";
import { DeviceStatusIndicator } from "./DeviceStatusIndicator";
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
  const needsHighlight = device.status === "offline";

  return (
    <article className="panel stack" style={needsHighlight ? { borderColor: "#f59e0b" } : undefined}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>{device.name}</strong>
        <DeviceStatusIndicator status={device.status} lastSeenAt={device.lastSeenAt} />
      </div>
      <small>MAC: {device.macAddress || "n/a"}</small>
      <small>Firmware: {device.firmwareVersion || "n/a"}</small>
      <DeviceActionsMenu device={device} userRole={userRole} {...actions} />
    </article>
  );
}
