import { useEffect } from "react";
import { CancelNotificationButton } from "./CancelNotificationButton";

type NotificationCountdownProps = {
  seconds?: number;
  initialSeconds?: number;
  isActive?: boolean;
  onCancel?: () => void;
  onComplete?: () => void;
  deviceName?: string;
  disabled?: boolean;
};

export function NotificationCountdown({
  seconds = 5,
  initialSeconds = 5,
  isActive = true,
  onCancel,
  onComplete,
  deviceName,
  disabled = false
}: NotificationCountdownProps) {
  useEffect(() => {
    if (isActive && seconds <= 0) {
      onComplete?.();
    }
  }, [isActive, seconds, onComplete]);

  if (!isActive) {
    return null;
  }

  return (
    <section className="panel stack">
      <h4>Sending standard notification</h4>
      <p>{deviceName ? `Device: ${deviceName}` : "Device not selected"}</p>
      <progress max={initialSeconds} value={seconds} />
      <p>{seconds} seconds left</p>
      {onCancel ? (
        <CancelNotificationButton
          onCancel={onCancel}
          disabled={disabled}
          remainingSeconds={seconds}
          isProcessing={false}
        />
      ) : null}
    </section>
  );
}
