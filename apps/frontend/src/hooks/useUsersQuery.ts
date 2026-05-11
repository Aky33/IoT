import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listUsers, createUser, updateUser, deleteUser, listCaregivers } from "../lib/api";
import type { UserFormValues } from "../types/user";

export function useUsersQuery(enabled = true) {
  return useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled,
  });
}

export function useCaregiversQuery(enabled = true) {
  return useQuery({
    queryKey: ["caregivers"],
    queryFn: listCaregivers,
    enabled,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: UserFormValues) => createUser(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) => updateUser(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); },
  });
}
