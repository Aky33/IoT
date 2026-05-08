import type { DeviceStatus } from "../../types/common";

type DeviceStatusIndicatorProps = {
  status: DeviceStatus;
  showLabel?: boolean;
  size?: "s" | "m" | "l";
  lastSeenAt?: string;
  tooltip?: string;
};

export function DeviceStatusIndicator({
  status,
  showLabel = true,
  size = "m",
  lastSeenAt,
  tooltip
}: DeviceStatusIndicatorProps) {
  const colorMap: Record<DeviceStatus, string> = {
    online: "#10b981",
    offline: "#f59e0b",
    unpaired: "#f59e0b",
    error: "#dc2626"
  };

  return (
    <span title={tooltip} className="row" style={{ alignItems: "center", gap: "0.3rem" }}>
      <span
        aria-hidden="true"
        data-size={size}
        style={{ width: "0.6rem", height: "0.6rem", borderRadius: "999px", background: colorMap[status] }}
      />
      {showLabel ? <span>{status}</span> : null}
      {status === "offline" && lastSeenAt ? <small>Last seen: {new Date(lastSeenAt).toLocaleString()}</small> : null}
    </span>
  );
}
