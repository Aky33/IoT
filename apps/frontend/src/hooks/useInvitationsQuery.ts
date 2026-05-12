import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listInvitations, createInvitation, revokeInvitation } from "../lib/api";

export function useInvitationsQuery(enabled = true) {
  return useQuery({ queryKey: ["invitations"], queryFn: listInvitations, enabled });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ role, ttlHours }: { role: string; ttlHours: number }) => createInvitation(role, ttlHours),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invitations"] }); },
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invitations"] }); },
  });
}
