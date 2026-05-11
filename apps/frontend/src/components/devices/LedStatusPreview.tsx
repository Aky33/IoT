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
    idle: "var(--color-idle)",
    sending: "var(--color-sending)",
    success: "var(--color-success)",
    error: "var(--color-danger)",
    urgent: "var(--color-urgent)",
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
          boxShadow: animated && status === "sending" ? "0 0 0.5rem var(--color-sending)" : "none"
        }}
      />
      {showLabel ? <strong>{status}</strong> : null}
      {description ? <span>{description}</span> : null}
    </section>
  );
}
