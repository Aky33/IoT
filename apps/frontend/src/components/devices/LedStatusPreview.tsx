import type { LedStatus } from "../../types/common";

type LedStatusPreviewProps = {
  status?: LedStatus;
  animated?: boolean;
  showLabel?: boolean;
  size?: "s" | "m" | "l";
  description?: string;
};

export function LedStatusPreview({
  status = "idle",
  animated = true,
  showLabel = true,
  size = "m",
  description
}: LedStatusPreviewProps) {
  const colorMap: Record<LedStatus, string> = {
    idle: "#9ca3af",
    sending: "#3b82f6",
    success: "#10b981",
    error: "#dc2626",
    urgent: "#f97316"
  };

  return (
    <section className="panel row" style={{ alignItems: "center" }}>
      <span
        aria-hidden="true"
        data-size={size}
        style={{
          width: "0.9rem",
          height: "0.9rem",
          borderRadius: "999px",
          background: colorMap[status],
          boxShadow: animated && status === "sending" ? "0 0 0.5rem #3b82f6" : "none"
        }}
      />
      {showLabel ? <strong>{status}</strong> : null}
      {description ? <span>{description}</span> : null}
    </section>
  );
}
