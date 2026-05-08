self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "Nova notifikace",
    tag: data.notificationId,
    data: {
      notificationId: data.notificationId,
      type: data.type
    }
  };

  if (data.type === "urgent") {
    options.requireInteraction = true;
    options.vibrate = [200, 100, 200, 100, 200];
  }

  event.waitUntil(self.registration.showNotification(data.title || "IoT Care", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/notifications"));
});
