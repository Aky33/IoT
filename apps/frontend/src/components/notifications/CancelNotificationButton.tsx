type CancelNotificationButtonProps = {
  onCancel: () => void;
  disabled?: boolean;
  label?: string;
  isProcessing?: boolean;
  remainingSeconds?: number;
};

export function CancelNotificationButton({
  onCancel,
  disabled = false,
  label = "Cancel notification",
  isProcessing = false,
  remainingSeconds
}: CancelNotificationButtonProps) {
  return (
    <button disabled={disabled || isProcessing} onClick={onCancel}>
      {label}
      {typeof remainingSeconds === "number" ? ` (${remainingSeconds}s)` : ""}
    </button>
  );
}
