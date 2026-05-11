import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotifications } from "../lib/api";
import type { Notification } from "../types/notification";

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const result = await listNotifications();
      return result.data;
    },
    enabled,
  });
}

export function useAddNotification() {
  const qc = useQueryClient();
  return (notification: Notification) => {
    qc.setQueryData<Notification[]>(["notifications"], (old) => {
      if (!old) return [notification];
      if (old.some((n) => n.id === notification.id)) return old;
      return [notification, ...old];
    });
  };
}
