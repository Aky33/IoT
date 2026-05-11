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
      <h2>Patients</h2>
      {onCreateUser ? <button onClick={onCreateUser}>Create patient</button> : null}
      {isLoading ? <LoadingState label="Loading patients..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!isLoading && !error && users.length === 0 ? (
        <EmptyState title="No patients" description="Create your first patient." />
      ) : null}
      {!isLoading && !error && users.length > 0 ? (
        <div className="stack">
          {users.map((user) => (
            <article key={user.id} className="panel stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{user.name}</strong>
                <div className="row">
                  {onEditUser ? (
                    <button onClick={() => onEditUser(user.id)}>Edit</button>
                  ) : null}
                  {onDeleteUser ? (
                    <button onClick={() => onDeleteUser(user.id)}>Delete</button>
                  ) : null}
                </div>
              </div>
              {user.notes ? <small>{user.notes}</small> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
