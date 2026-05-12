import { useState } from "react";
import { simulateDevicePress } from "../../lib/api";

type DeviceButtonSimulatorProps = {
  deviceId: string;
  deviceName: string;
  disabled?: boolean;
};

export function DeviceButtonSimulator({ deviceId, deviceName, disabled = false }: DeviceButtonSimulatorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handlePress(type: "standard" | "urgent") {
    setIsProcessing(true);
    setResult(null);
    try {
      await simulateDevicePress(deviceId, type);
      setResult(`${type === "urgent" ? "Urgent" : "Standard"} notification sent from "${deviceName}".`);
    } catch {
      setResult("Simulation failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="panel stack">
      <h4>Button simulator</h4>
      <p><small>Simulate a physical button press on this device.</small></p>
      <div className="row">
        <button type="button" disabled={disabled || isProcessing} onClick={() => handlePress("standard")}>
          Standard press
        </button>
        <button type="button" disabled={disabled || isProcessing} onClick={() => handlePress("urgent")}>
          Urgent press (long)
        </button>
      </div>
      {result ? <p role="status"><small>{result}</small></p> : null}
    </section>
  );
}
