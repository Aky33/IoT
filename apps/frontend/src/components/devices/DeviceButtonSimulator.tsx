type DeviceButtonSimulatorProps = {
  deviceId: string;
  deviceName: string;
  onStandardPress?: (deviceId: string) => void;
  onUrgentPress?: (deviceId: string) => void;
  disabled?: boolean;
  isProcessing?: boolean;
  mode?: "development" | "demo" | "admin";
};

export function DeviceButtonSimulator({
  deviceId,
  deviceName,
  onStandardPress,
  onUrgentPress,
  disabled = false,
  isProcessing = false,
  mode = "development"
}: DeviceButtonSimulatorProps) {
  if (!deviceId) {
    return null;
  }

  return (
    <section className="panel stack">
      <h4>Button simulator ({mode})</h4>
      <p>{deviceName}</p>
      <div className="row">
        {onStandardPress ? (
          <button disabled={disabled || isProcessing} onClick={() => onStandardPress(deviceId)}>
            Standard press
          </button>
        ) : null}
        {onUrgentPress ? (
          <button disabled={disabled || isProcessing} onClick={() => onUrgentPress(deviceId)}>
            Urgent press
          </button>
        ) : null}
      </div>
    </section>
  );
}
