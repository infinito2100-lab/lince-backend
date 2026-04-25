const admin = require("firebase-admin");
const fs = require("fs");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});

// 📲 leer tokens
const tokens = fs.readFileSync("tokens.txt", "utf8")
  .split("\n")
  .map(t => t.trim())
  .filter(Boolean);

async function enviarNotificaciones() {
  console.log("🚀 Iniciando envío...");
  console.log("📲 Tokens encontrados:", tokens.length);

  for (const token of tokens) {
    const message = {
      token,
      notification: {
        title: "Lince Online",
        body: "Mensaje para todos 🚀"
      }
    };

    try {
      const res = await admin.messaging().send(message);
      console.log("✅ Enviado:", res);
    } catch (err) {
      console.log("❌ Error token:", token);
      console.log("🔥 Firebase error:", err.code || err.message);
    }
  }

  console.log("🏁 ENVÍO COMPLETADO");
}

enviarNotificaciones();