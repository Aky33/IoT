import type { Caregiver } from "../../lib/api";
import type { UserRole } from "../../types/common";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";

type AdminCaregiversPageProps = {
  caregivers?: Caregiver[];
  userRole: UserRole;
  isLoading?: boolean;
  error?: string | null;
  onEditCaregiver?: (caregiverId: string) => void;
  onDeleteCaregiver?: (caregiverId: string) => void;
};

export function AdminCaregiversPage({
  caregivers = [],
  userRole,
  isLoading = false,
  error = null,
  onEditCaregiver,
  onDeleteCaregiver,
}: AdminCaregiversPageProps) {
  if (userRole !== "admin") {
    return <ErrorState message="Access denied." />;
  }

  return (
    <section className="page">
      <h2>Caregivers</h2>
      {isLoading ? <LoadingState label="Loading caregivers..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!isLoading && !error && caregivers.length === 0 ? (
        <EmptyState title="No caregivers" description="Caregivers are added via invitation." />
      ) : null}
      {!isLoading && !error && caregivers.length > 0 ? (
        <div className="stack">
          {caregivers.map((caregiver) => (
            <article key={caregiver.id} className="panel stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="stack" style={{ gap: "0.25rem" }}>
                  <strong>{caregiver.name}</strong>
                  <small>{caregiver.email}</small>
                  {caregiver.phone ? <small>{caregiver.phone}</small> : null}
                  <small>
                    Role: {caregiver.role} &mdash; {caregiver.isActive ? "Active" : "Inactive"}
                  </small>
                </div>
                <div className="row">
                  {onEditCaregiver ? (
                    <button type="button" onClick={() => onEditCaregiver(caregiver.id)}>Edit</button>
                  ) : null}
                  {onDeleteCaregiver ? (
                    <button type="button" onClick={() => onDeleteCaregiver(caregiver.id)}>Delete</button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
