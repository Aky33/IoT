import { useState } from "react";
import type { UserRole } from "../../types/common";
import { useInvitationsQuery, useCreateInvitation, useRevokeInvitation } from "../../hooks/useInvitationsQuery";
import { CreateInvitationModal } from "../../components/invitations/CreateInvitationModal";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";

type AdminInvitationsPageProps = {
  userRole: UserRole;
};

export function AdminInvitationsPage({ userRole }: AdminInvitationsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: invitations = [], isLoading, error } = useInvitationsQuery(userRole === "admin");
  const createMutation = useCreateInvitation();
  const revokeMutation = useRevokeInvitation();

  if (userRole !== "admin") {
    return <ErrorState message="Access denied." />;
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-header__title">
          <h2>Invitations</h2>
          <p>Generate one-time codes for new caregivers or admins.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            createMutation.reset();
            setIsModalOpen(true);
          }}
        >
          + Create invitation
        </button>
      </header>

      {isLoading ? <LoadingState label="Loading invitations…" /> : null}
      {error ? <ErrorState message={error.message} /> : null}
      {!isLoading && !error && invitations.length === 0 ? (
        <EmptyState
          title="No invitations"
          description="Create an invitation to allow new users to join."
        />
      ) : null}
      {!isLoading && !error && invitations.length > 0 ? (
        <div className="list-stack">
          {invitations.map((invitation) => (
            <article key={invitation.id} className="panel">
              <div className="item-row">
                <div className="item-row__main">
                  <span className="item-row__title text-mono">{invitation.code}</span>
                  <span className="item-row__meta">
                    Role <strong>{invitation.role}</strong> · Expires{" "}
                    {new Date(invitation.expiresAt).toLocaleString()} · Created{" "}
                    {new Date(invitation.createdAt).toLocaleString()}
                  </span>
                  {revokeMutation.error ? (
                    <span className="text-danger text-sm" role="alert">
                      {revokeMutation.error.message}
                    </span>
                  ) : null}
                </div>
                <div className="item-row__actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={() => revokeMutation.mutate(invitation.id)}
                    disabled={revokeMutation.isPending}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <CreateInvitationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          createMutation.reset();
        }}
        onCreate={async (role, ttlHours) => {
          try {
            return await createMutation.mutateAsync({ role, ttlHours });
          } catch {
            return undefined;
          }
        }}
        isSubmitting={createMutation.isPending}
        error={createMutation.error?.message ?? null}
      />
    </section>
  );
}
