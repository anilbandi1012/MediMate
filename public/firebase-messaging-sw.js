importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDf-kM_xsFhpC0WlrOrzB5KcgQaMStmZoM",
  authDomain: "medimate-b2089.firebaseapp.com",
  projectId: "medimate-b2089",
  messagingSenderId: "1000035047282",
  appId: "1:1000035047282:web:1e313b928df300ce766feb"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] Received background message:", payload);

  const notificationTitle =
    payload.data?.title || payload.notification?.title || "Medicine Reminder 💊";

  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body || "Time to take your medicine!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [500, 300, 500, 300, 1000],
    requireInteraction: true,
    renotify: true,
    tag: "medicine-reminder",
    data: {
      url: payload.data?.screen
        ? `https://medi-mate-lime.vercel.app${payload.data.screen}`
        : "https://medi-mate-lime.vercel.app/reminders"
    },
    actions: [
      {
        action: "open",
        title: "Open App"
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || "https://medi-mate-lime.vercel.app/reminders";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});