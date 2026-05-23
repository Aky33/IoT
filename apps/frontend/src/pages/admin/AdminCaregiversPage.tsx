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
      <header className="page-header">
        <div className="page-header__title">
          <h2>Caregivers</h2>
          <p>People who respond to alerts.</p>
        </div>
      </header>
      {isLoading ? <LoadingState label="Loading caregivers…" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!isLoading && !error && caregivers.length === 0 ? (
        <EmptyState title="No caregivers" description="Caregivers are added via invitation." />
      ) : null}
      {!isLoading && !error && caregivers.length > 0 ? (
        <div className="list-stack">
          {caregivers.map((caregiver) => (
            <article key={caregiver.id} className="panel">
              <div className="item-row">
                <div className="item-row__main">
                  <span className="item-row__title">
                    {caregiver.name}
                    <span className={`badge ${caregiver.role === "admin" ? "badge-standard" : "badge-muted"}`}>
                      {caregiver.role}
                    </span>
                    {!caregiver.isActive ? <span className="badge badge-warning">Inactive</span> : null}
                  </span>
                  <span className="item-row__meta">
                    {caregiver.email}
                    {caregiver.phone ? ` · ${caregiver.phone}` : ""}
                  </span>
                </div>
                <div className="item-row__actions">
                  {onEditCaregiver ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onEditCaregiver(caregiver.id)}
                    >
                      Edit
                    </button>
                  ) : null}
                  {onDeleteCaregiver ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-danger"
                      onClick={() => onDeleteCaregiver(caregiver.id)}
                    >
                      Delete
                    </button>
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
