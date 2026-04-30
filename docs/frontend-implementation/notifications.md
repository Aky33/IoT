# Notifications — Frontend Integration Guide

This guide explains how to integrate Web Push notifications and Server-Sent Events (SSE) with the IoT Care backend.

## Overview

Two complementary channels deliver notifications to caregivers:

| Channel | Purpose | Works when browser is closed? |
|---|---|---|
| **Web Push** | OS-level notification (sound, vibration) | Yes |
| **SSE** | Real-time in-app update (toast, badge) | No — only while app is open |

## 1. Service Worker Registration

Register a Service Worker at app startup:

```js
// main.js or app entry point
if ('serviceWorker' in navigator) {
  const registration = await navigator.serviceWorker.register('/sw.js');
  console.log('SW registered:', registration.scope);
}
```

## 2. Get VAPID Public Key

```js
const res = await fetch('/push/vapid-public-key', {
  headers: { 'Authorization': `Bearer ${accessToken}` },
});
const { vapidPublicKey } = await res.json();
```

## 3. Subscribe to Push Notifications

```js
// Request permission
const permission = await Notification.requestPermission();
if (permission !== 'granted') {
  // Show warning banner: "Notifications are disabled"
  return;
}

// Subscribe via Push API
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
});

// Send subscription to backend
await fetch('/push/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify(subscription),
});
```

## 4. Service Worker — Push Event Handler

```js
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'Nová notifikace',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.notificationId,
    data: { notificationId: data.notificationId, type: data.type },
  };

  if (data.type === 'urgent') {
    options.requireInteraction = true;
    options.vibrate = [200, 100, 200, 100, 200];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'IoT Care', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/notifications')
  );
});
```

## 5. SSE — Real-Time In-App Updates

SSE provides instant updates when the app is open. Connect after login:

```js
// EventSource does not support custom headers natively.
// Pass the token as a query parameter.
const source = new EventSource(
  `/notifications/stream?token=${accessToken}`
);

source.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Show toast, update badge count, play sound, etc.
  console.log('New notification:', notification);
};

source.onerror = () => {
  // EventSource auto-reconnects. Log for debugging.
  console.warn('SSE connection error, reconnecting...');
};
```

> **Note:** The backend SSE handler accepts JWT via `?token=` query parameter because `EventSource` does not support custom headers.

## 6. Unsubscribe (Logout)

On logout, clean up both channels:

```js
// Close SSE
source.close();

// Unsubscribe from push
await fetch('/push/unsubscribe', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${accessToken}` },
});
```

## 7. Handling Disabled Notifications

Check permission state on app load:

```js
if (Notification.permission === 'denied') {
  // Show persistent banner:
  // "Notifikace jsou vypnuté. Můžete přijít o urgentní alerty."
  // Link to browser settings instructions.
}

if (Notification.permission === 'default') {
  // User hasn't decided yet. Show a prompt explaining why
  // notifications matter for this care system.
}
```

## Notification Payload Format

### Web Push payload (received in `sw.js`)

```json
{
  "title": "URGENTNÍ ALERT",
  "body": "Zařízení: Tlačítko obývák",
  "type": "urgent",
  "notificationId": "664a1b..."
}
```

### SSE event data (received via `EventSource`)

```json
{
  "id": "664a1b...",
  "type": "urgent",
  "deviceName": "Tlačítko obývák",
  "createdAt": "2026-04-29T10:30:00.000Z"
}
```

## Architecture Diagram

```
Gateway (HMAC) → POST /notifications/create
                        ↓
              notificationService
              ├─→ MongoDB (save)
              ├─→ Web Push (web-push lib → browser Service Worker)
              └─→ SSE emit (EventEmitter → open connections)
```
