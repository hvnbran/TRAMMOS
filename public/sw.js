/* TRAMMOS Service Worker — solo push notifications. No cachea nada. */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "TRAMMOS", body: event.data ? event.data.text() : "Tienes una novedad" };
  }

  const title = payload.title || "TRAMMOS";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "trammos-default",
    renotify: true,
    requireInteraction: false,
    data: {
      url: payload.url || "/pasajero",
      ...(payload.data || {}),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/pasajero";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          try {
            const u = new URL(client.url);
            if (u.pathname.startsWith("/pasajero")) {
              return client.focus();
            }
          } catch (e) { /* ignore */ }
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return null;
    }),
  );
});
