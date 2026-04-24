const admin = require("firebase-admin");
const fs = require("fs");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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