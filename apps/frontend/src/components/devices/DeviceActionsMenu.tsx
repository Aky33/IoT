import type { Device } from "../../types/device";
import type { UserRole } from "../../types/common";

type DeviceActionsMenuProps = {
  device: Device;
  userRole: UserRole;
  onOpenDetail?: (deviceId: string) => void;
  onEdit?: (deviceId: string) => void;
  onDelete?: (deviceId: string) => void;
  isProcessing?: boolean;
};

export function DeviceActionsMenu({
  device,
  userRole,
  onOpenDetail,
  onEdit,
  onDelete,
  isProcessing = false
}: DeviceActionsMenuProps) {
  return (
    <div className="row">
      {onOpenDetail ? <button onClick={() => onOpenDetail(device.id)}>Detail</button> : null}
      {userRole === "admin" && onEdit ? <button disabled={isProcessing} onClick={() => onEdit(device.id)}>Edit</button> : null}
      {userRole === "admin" && onDelete ? <button disabled={isProcessing} onClick={() => onDelete(device.id)}>Delete</button> : null}
    </div>
  );
}
