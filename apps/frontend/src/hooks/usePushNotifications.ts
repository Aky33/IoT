import { useEffect, useState } from "react";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushState,
  type PushPermissionState,
  syncPushSubscription,
} from "../lib/api";
import { getErrorMessage } from "../lib/error";

export function usePushNotifications(authStatus: "loading" | "authenticated" | "unauthenticated") {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<PushPermissionState>("default");
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setPushEnabled(false);
      setPushPermission("default");
      return;
    }

    (async () => {
      try {
        const state = await getPushState();
        setPushPermission(state.permission);

        if (state.permission === "granted" && state.subscribed) {
          // Browser allowed + subscription exists → sync with backend
          await syncPushSubscription();
          setPushEnabled(true);
        } else if (state.permission === "granted" && !state.subscribed) {
          // Browser allowed, but subscription missing → create
          await enablePushNotifications();
          setPushEnabled(true);
        } else if (state.permission === "denied") {
          // Browser blocks → clean up stale subscription from DB
          await disablePushNotifications().catch(() => undefined);
          setPushEnabled(false);
        } else {
          setPushEnabled(false);
        }
      } catch {
        setPushEnabled(false);
      }
    })();
  }, [authStatus]);

  async function togglePush(nextEnabled: boolean) {
    setPushError(null);

    try {
      if (nextEnabled) {
        await enablePushNotifications();
        setPushPermission("granted");
      } else {
        await disablePushNotifications();
      }

      setPushEnabled(nextEnabled);
    } catch (error) {
      const state = await getPushState().catch(() => null);
      if (state) {
        setPushPermission(state.permission);
        setPushEnabled(state.subscribed);
      }
      setPushError(getErrorMessage(error, "Unable to update push notifications."));
    }
  }

  return { pushEnabled, pushPermission, pushError, togglePush };
}
