importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCqGp61EDNNVxQNk42kYZ5T69hcayU0M1k",
  authDomain: "linceonline-15a9b.firebaseapp.com",
  projectId: "linceonline-15a9b",
  messagingSenderId: "422128278712",
  appId: "1:422128278712:web:e6c3f949f506093c83284d"
});

const messaging = firebase.messaging();

// 🔥 ESTO ES LO IMPORTANTE
messaging.onBackgroundMessage(function(payload) {
  console.log("📩 BACKGROUND MESSAGE:", payload);

  const title = payload.notification?.title || "Lince Online";
  const body = payload.notification?.body || "Nueva notificación";

  self.registration.showNotification(title, {
    body: body,
    icon: "/icon.png",
    badge: "/icon.png"
  });
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
