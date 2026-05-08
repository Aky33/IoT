import type { NotificationStatus, NotificationType } from "../../types/common";

type NotificationBadgeProps = {
  type: NotificationType;
  status: NotificationStatus;
  size?: "s" | "m" | "l";
  showIcon?: boolean;
  label?: string;
};

export function NotificationBadge({
  type,
  status,
  size = "m",
  showIcon = true,
  label
}: NotificationBadgeProps) {
  const icon = type === "urgent" ? "!" : "i";
  const text = label ?? `${type} - ${status}`;

  return (
    <span className={`badge ${type === "urgent" ? "badge-urgent" : "badge-standard"}`} data-size={size}>
      {showIcon ? `${icon} ` : ""}
      {text}
    </span>
  );
}
