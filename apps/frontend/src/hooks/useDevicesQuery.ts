import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDevices, createDevice, updateDevice, deleteDevice, getDevice } from "../lib/api";
import type { DeviceFormValues } from "../types/device";

export function useDevicesQuery(enabled = true) {
  return useQuery({
    queryKey: ["devices"],
    queryFn: listDevices,
    enabled,
  });
}

export function useDeviceDetailQuery(deviceId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["devices", deviceId],
    queryFn: () => getDevice(deviceId!),
    enabled: enabled && Boolean(deviceId),
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: DeviceFormValues) => createDevice(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["devices"] }); },
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DeviceFormValues }) => updateDevice(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["devices"] }); },
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDevice(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["devices"] }); },
  });
}
