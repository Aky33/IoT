import { request, ApiError } from "./api-client";

export type PushPermissionState = "granted" | "denied" | "default" | "unsupported";

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function urlBase64ToUint8Array(value: string) {
  const decoded = decodeBase64Url(value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export async function getPushState(): Promise<{ permission: PushPermissionState; subscribed: boolean }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { permission: "unsupported", subscribed: false };
  }

  const permission = Notification.permission as PushPermissionState;
  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.getSubscription();

  return { permission, subscribed: Boolean(subscription) };
}

export async function syncPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) return false;

  const { endpoint, keys } = subscription.toJSON();
  await request("/push/subscribe", {
    method: "POST",
    body: { endpoint, keys },
  });
  return true;
}

export async function enablePushNotifications() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new ApiError("Push notifications are not supported in this browser.", 400);
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new ApiError("Notification permission was not granted.", 400);
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const keyResponse = await request<{ vapidPublicKey: string }>("/push/vapid-public-key");

  if (!keyResponse?.vapidPublicKey) {
    throw new ApiError("Missing VAPID public key.", 500);
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyResponse.vapidPublicKey),
    });
  }

  const { endpoint, keys } = subscription.toJSON();
  await request("/push/subscribe", {
    method: "POST",
    body: { endpoint, keys },
  });
}

export async function disablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
  }

  await request("/push/unsubscribe", { method: "DELETE" });
}
