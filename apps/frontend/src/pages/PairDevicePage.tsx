import type { UserRole, PairingStatusType } from "../types/common";
import { PairingCodeInput } from "../components/devices/PairingCodeInput";
import { PairingStatus } from "../components/devices/PairingStatus";

type PairDevicePageProps = {
  userRole: UserRole;
  pairingCode?: string;
  pairingStatus?: PairingStatusType;
  pairingMessage?: string;
  onPairingCodeChange: (value: string) => void;
  onPair: (pairingCode: string) => void;
  onCancel?: () => void;
  onRetry?: () => void;
};

export function PairDevicePage({
  userRole,
  pairingCode = "",
  pairingStatus = "idle",
  pairingMessage,
  onPairingCodeChange,
  onPair,
  onCancel,
  onRetry
}: PairDevicePageProps) {
  const canPair = pairingCode.trim().length > 0 && pairingStatus !== "pending";

  return (
    <section className="page">
      <h2>Pair device</h2>
      <p>Role: {userRole}</p>
      {(pairingStatus === "idle" || pairingStatus === "error") && (
        <PairingCodeInput
          value={pairingCode}
          onChange={onPairingCodeChange}
          onSubmit={() => canPair && onPair(pairingCode)}
          disabled={pairingStatus === "pending"}
        />
      )}
      <PairingStatus status={pairingStatus} message={pairingMessage} onRetry={onRetry} />
      {onCancel ? <button onClick={onCancel}>Cancel</button> : null}
    </section>
  );
}
