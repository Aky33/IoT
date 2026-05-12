import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCaregivers, updateCaregiver, deleteCaregiver } from "../lib/api";
import type { CaregiverFormValues } from "../lib/api";

export function useCaregiversQuery(enabled = true) {
  return useQuery({
    queryKey: ["caregivers"],
    queryFn: listCaregivers,
    enabled,
  });
}

export function useUpdateCaregiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CaregiverFormValues }) =>
      updateCaregiver(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["caregivers"] }); },
  });
}

export function useDeleteCaregiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCaregiver(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["caregivers"] }); },
  });
}
