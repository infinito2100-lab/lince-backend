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

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 🔥 FIX REAL
self.addEventListener("push", function (event) {
  const payload = event.data?.json() || {};

  const title = payload.notification?.title || payload.data?.title || "Lince Online";
  const body = payload.notification?.body || payload.data?.body || "Nueva notificación";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: "/icon.png",
      badge: "/icon.png"
    })
  );
});
