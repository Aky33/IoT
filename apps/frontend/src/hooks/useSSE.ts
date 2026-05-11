import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken, onTokenChange } from "../lib/api";
import type { Notification } from "../types/notification";

export function useSSE(
  authStatus: "loading" | "authenticated" | "unauthenticated",
  userRole: string | undefined,
) {
  const qc = useQueryClient();
  const sseRef = useRef<EventSource | null>(null);
  const [tokenVersion, setTokenVersion] = useState(0);

  useEffect(() => {
    return onTokenChange(() => setTokenVersion((v) => v + 1));
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated" || userRole !== "caregiver") {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const url = `/notifications/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);
    sseRef.current = source;

    source.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data as string) as {
          id: string;
          type: "standard" | "urgent";
          deviceName?: string;
          createdAt: string;
        };
        const notification: Notification = {
          id: incoming.id,
          type: incoming.type,
          status: "pending" as const,
          deviceId: "",
          deviceName: incoming.deviceName ?? "Unknown device",
          createdAt: incoming.createdAt,
        };
        qc.setQueryData<Notification[]>(["notifications"], (old) => {
          if (!old) return [notification];
          if (old.some((n) => n.id === notification.id)) return old;
          return [notification, ...old];
        });
      } catch {
        // Ignore malformed SSE events
      }
    };

    return () => {
      source.close();
      sseRef.current = null;
    };
  }, [authStatus, userRole, tokenVersion, qc]);
}
