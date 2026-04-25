require("dotenv").config();

const admin = require("firebase-admin");
const axios = require("axios");

// 🔥 validar clave
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("FIREBASE_PRIVATE_KEY no está definida en .env");
}

// 🔥 Firebase init
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});

async function enviarNotificaciones() {
  console.log("🚀 Iniciando envío...");

  let tokens = [];

  try {
    // 🌐 traer tokens desde Render
    const res = await axios.get("https://lince-backend.onrender.com/tokens");
    tokens = res.data;
  } catch (err) {
    console.log("❌ Error obteniendo tokens desde backend:", err.message);
    return;
  }

  console.log("📲 Tokens encontrados:", tokens.length);

  if (!tokens.length) {
    console.log("❌ No hay tokens para enviar");
    return;
  }

  // 🧹 lista limpia de tokens válidos
  const tokensValidos = [];

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

      // ✔️ si funciona, lo guardamos
      tokensValidos.push(token);

    } catch (err) {
      console.log("❌ Error token:", token);
      console.log("🔥 Firebase error:", err.code || err.message);

      // 🧹 si el token es inválido, NO lo guardamos
      if (err.code === "messaging/registration-token-not-registered") {
        console.log("🧹 Token eliminado automáticamente");
      }
    }
  }

  // 📦 actualizar backend con tokens limpios
  try {
    await axios.post("https://lince-backend.onrender.com/update-tokens", {
      tokens: tokensValidos
    });

    console.log("💾 Tokens actualizados en backend");
  } catch (err) {
    console.log("⚠️ No se pudieron actualizar tokens:", err.message);
  }

  console.log("🏁 ENVÍO COMPLETADO");
}

enviarNotificaciones();