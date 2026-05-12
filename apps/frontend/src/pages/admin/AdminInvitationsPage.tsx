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
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2>Invitations</h2>
        <button
          type="button"
          onClick={() => {
            createMutation.reset();
            setIsModalOpen(true);
          }}
        >
          Create invitation
        </button>
      </div>

      {isLoading ? <LoadingState label="Loading invitations..." /> : null}
      {error ? <ErrorState message={error.message} /> : null}
      {!isLoading && !error && invitations.length === 0 ? (
        <EmptyState
          title="No invitations"
          description="Create an invitation to allow new users to join."
        />
      ) : null}
      {!isLoading && !error && invitations.length > 0 ? (
        <div className="stack">
          {invitations.map((invitation) => (
            <article key={invitation.id} className="panel stack">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div className="stack" style={{ gap: "0.25rem", flex: 1, minWidth: 0 }}>
                  <label style={{ display: "block" }}>
                    Code
                    <input
                      readOnly
                      value={invitation.code}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      style={{ fontFamily: "monospace" }}
                    />
                  </label>
                  <small>
                    Role: <strong>{invitation.role}</strong>
                  </small>
                  <small>Expires: {new Date(invitation.expiresAt).toLocaleString()}</small>
                  <small>Created: {new Date(invitation.createdAt).toLocaleString()}</small>
                </div>
                <button
                  type="button"
                  onClick={() => revokeMutation.mutate(invitation.id)}
                  disabled={revokeMutation.isPending}
                  style={{ marginLeft: "1rem", flexShrink: 0 }}
                >
                  Revoke
                </button>
              </div>
              {revokeMutation.error ? (
                <p role="alert" style={{ color: "var(--color-danger-border)" }}>
                  {revokeMutation.error.message}
                </p>
              ) : null}
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
