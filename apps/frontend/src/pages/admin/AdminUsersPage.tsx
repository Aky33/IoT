import type { User } from "../../types/user";
import type { UserRole } from "../../types/common";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";

type AdminUsersPageProps = {
  users?: User[];
  userRole: UserRole;
  isLoading?: boolean;
  error?: string | null;
  onCreateUser?: () => void;
  onEditUser?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
};

export function AdminUsersPage({
  users = [],
  userRole,
  isLoading = false,
  error = null,
  onCreateUser,
  onEditUser,
  onDeleteUser,
}: AdminUsersPageProps) {
  if (userRole !== "admin") {
    return <ErrorState message="Access denied." />;
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-header__title">
          <h2>Patients</h2>
          <p>People who use the care buttons.</p>
        </div>
        {onCreateUser ? (
          <button type="button" className="btn btn-primary" onClick={onCreateUser}>
            + Create patient
          </button>
        ) : null}
      </header>
      {isLoading ? <LoadingState label="Loading patients…" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!isLoading && !error && users.length === 0 ? (
        <EmptyState title="No patients yet" description="Create your first patient." />
      ) : null}
      {!isLoading && !error && users.length > 0 ? (
        <div className="list-stack">
          {users.map((user) => (
            <article key={user.id} className="panel">
              <div className="item-row">
                <div className="item-row__main">
                  <span className="item-row__title">{user.name}</span>
                  {user.notes ? <span className="item-row__meta">{user.notes}</span> : null}
                </div>
                <div className="item-row__actions">
                  {onEditUser ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onEditUser(user.id)}
                    >
                      Edit
                    </button>
                  ) : null}
                  {onDeleteUser ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-danger"
                      onClick={() => onDeleteUser(user.id)}
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
