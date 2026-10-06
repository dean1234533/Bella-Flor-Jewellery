// Bella Flor Admin — service worker
// • caches the dashboard shell so it opens instantly / offline
// • shows push notifications for new orders & enquiries

const CACHE = "bf-admin-v1";
const SHELL = [
  "/admin/",
  "/admin/admin.css?v=1",
  "/admin/admin.js?v=1",
  "/admin/manifest.webmanifest",
  "/admin/icon-192.png",
  "/admin/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first (always fresh when online), cache as the offline fallback.
// API calls are never cached.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin) return;
  if (!url.pathname.startsWith("/admin/")) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request, { ignoreSearch: false }).then((hit) => hit || caches.match("/admin/")))
  );
});

// The push carries no data; ask the server what's new, then notify.
self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let title = "Bella Flor Admin";
    let body = "You have something new.";
    try {
      const res = await fetch("/api/admin/summary", { cache: "no-store" });
      if (res.ok) {
        const s = await res.json();
        const o = s.latestOrder, e = s.latestEnquiry;
        const orderIsNewest = o && (!e || o.created_at >= e.created_at);
        if (s.test) {
          title = "Notifications are working ✅";
          body = "You'll be alerted here for new orders and enquiries.";
        } else if (orderIsNewest) {
          title = "New order 🛍️";
          body = `${o.customer_name || "A customer"} · £${(o.total_pence / 100).toFixed(2)}`;
        } else if (e) {
          title = "New enquiry ✉️";
          body = `${e.name} sent you a message`;
        }
        const unread = (s.newOrders || 0) + (s.newEnquiries || 0);
        if (unread && navigator.setAppBadge) navigator.setAppBadge(unread).catch(() => {});
      }
    } catch { /* offline or signed out: show the generic message */ }

    await self.registration.showNotification(title, {
      body,
      icon: "/admin/icon-192.png",
      badge: "/admin/icon-192.png",
      tag: "bf-admin",
      renotify: true,
      data: { url: "/admin/" },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = all.find((c) => new URL(c.url).pathname.startsWith("/admin"));
    if (open) return open.focus();
    return self.clients.openWindow("/admin/");
  })());
});
