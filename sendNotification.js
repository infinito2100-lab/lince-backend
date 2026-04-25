const admin = require("firebase-admin");
const fs = require("fs");

// 🔐 Firebase Admin (tu archivo JSON debe estar aquí)
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 📁 leer tokens
const tokens = fs.readFileSync("tokens.txt", "utf8")
  .split("\n")
  .filter(Boolean);

if (tokens.length === 0) {
  console.log("❌ No hay tokens");
  process.exit();
}

// 📩 mensaje
const message = {
  notification: {
    title: "📢 Lince Online",
    body: "Notificación enviada desde CMD"
  },
  tokens: tokens
};

// 🚀 enviar
admin.messaging().sendEachForMulticast(message)
  .then((response) => {
    console.log("✅ Enviadas:", response.successCount);
    console.log("❌ Fallidas:", response.failureCount);
  })
  .catch((error) => {
    console.log("❌ ERROR:", error);
  });