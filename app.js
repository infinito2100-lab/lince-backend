import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqGp61EDNNVxQNk42kYZ5T69hcayU0M1k",
  authDomain: "linceonline-15a9b.firebaseapp.com",
  projectId: "linceonline-15a9b",
  messagingSenderId: "422128278712",
  appId: "1:422128278712:web:e6c3f949f506093c83284d"
};

const app = initializeApp(firebaseConfig);

console.log("APP.JS CARGADO");

let messaging;

// ✔ SOLO INICIALIZA SI ES COMPATIBLE (FIX IMPORTANTE)
isSupported().then((supported) => {
  if (!supported) {
    console.log("❌ Firebase Messaging no soportado");
    return;
  }

  messaging = getMessaging(app);

  iniciarNotificaciones();
});

// ✔ REGISTRO SERVICE WORKER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log("✅ SW registrado:", registration.scope);
    })
    .catch((error) => {
      console.log("❌ Error SW:", error);
    });
}

async function iniciarNotificaciones() {
  try {
    const permission = await Notification.requestPermission();
    console.log("🔔 Permiso:", permission);

    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;

    console.log("✅ SW listo");

    const token = await getToken(messaging, {
      vapidKey: "BJ340tm8nQaXzFKBofVpownSUg8Ok519XanWyYwMOBoi-7Pxiczho74yahoAw1nRspbB4_8i2T2dpYcLMIMh764",
      serviceWorkerRegistration: registration
    });

    if (token) {
      localStorage.setItem("fcm_token", token);
      window.token = token;

      console.log("📲 TOKEN:", token);

      // ✔ enviar al backend
  fetch("https://lince-backend.onrender.com/save-token", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ token })
})
.then(res => res.text())
.then(data => {
  console.log("📡 RESPUESTA BACKEND:", data);
})
.catch(err => {
  console.log("❌ ERROR EN FETCH:", err);
});

    } else {
      console.log("❌ NO TOKEN GENERADO");
    }

  } catch (err) {
    console.log("❌ ERROR:", err);
  }
}

// ✔ recibir mensajes en primer plano
if (messaging) {
  onMessage(messaging, (payload) => {
    console.log("📩 Mensaje recibido:", payload);
  });
}