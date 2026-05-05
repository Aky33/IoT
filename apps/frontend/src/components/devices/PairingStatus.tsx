import type { PairingStatusType } from "../../types/common";

type PairingStatusProps = {
  status?: PairingStatusType;
  message?: string;
  deviceName?: string;
  onRetry?: () => void;
  onContinue?: () => void;
};

export function PairingStatus({
  status = "idle",
  message,
  deviceName,
  onRetry,
  onContinue
}: PairingStatusProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <section className="panel stack">
      <h4>Pairing status: {status}</h4>
      {deviceName ? <p>Device: {deviceName}</p> : null}
      {message ? <p>{message}</p> : null}
      <div className="row">
        {status === "error" && onRetry ? <button onClick={onRetry}>Retry</button> : null}
        {status === "success" && onContinue ? <button onClick={onContinue}>Continue</button> : null}
      </div>
    </section>
  );
}
