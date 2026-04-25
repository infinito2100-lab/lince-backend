const express = require("express");
const admin = require("firebase-admin");

const app = express();

// JSON
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});


// 🔥 FIREBASE INIT
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("❌ Falta FIREBASE_SERVICE_ACCOUNT en Render");
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore
const db = admin.firestore();


// 🔹 SAVE TOKEN
app.post("/save-token", async (req, res) => {
  const token = req.body?.token;

  if (!token) {
    return res.status(400).send("NO TOKEN");
  }

  try {
    await db.collection("tokens").doc(token).set({
      token,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("📥 Token guardado:", token);
    res.send("OK");

  } catch (error) {
    console.log("❌ Error guardando token:", error);
    res.status(500).send("ERROR");
  }
});


// 🔹 VER TOKENS
app.get("/tokens", async (req, res) => {
  try {
    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.id);

    res.json(tokens);

  } catch (error) {
    res.status(500).send("ERROR");
  }
});


// 🔔 ENVIAR NOTIFICACIÓN A TODOS
app.get("/send", async (req, res) => {
  try {
    const snapshot = await db.collection("tokens").get();
    const tokens = snapshot.docs.map(doc => doc.id);

    if (tokens.length === 0) {
      return res.send("❌ No hay tokens");
    }

    const message = {
      notification: {
        title: "Prueba",
        body: "Hola desde backend"
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("📨 Enviados:", response.successCount);
    console.log("❌ Fallos:", response.failureCount);

    res.json({
      success: response.successCount,
      failure: response.failureCount
    });

  } catch (error) {
    console.log("❌ Error:", error);
    res.status(500).send(error.message);
  }
});


// HOME
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend activo",
    routes: ["/save-token", "/tokens", "/send"]
  });
});


// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Backend listo en puerto " + PORT);
});