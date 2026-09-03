require("dotenv").config();

const express = require("express");
const admin = require("firebase-admin");

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

// =========================
// FIREBASE
// =========================

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("❌ Falta FIREBASE_SERVICE_ACCOUNT en Render");
}

const serviceAccount =
  JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// =========================
// GUARDAR TOKEN
// =========================

app.post("/save-token", async (req, res) => {

  const token = req.body?.token;

  if (!token) {
    return res.status(400).send("NO TOKEN");
  }

  try {

    await db.collection("tokens").doc(token).set({
      token: token,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("✅ Token guardado");

    res.send("OK");

  } catch (error) {

    console.error("❌ Error guardando token:", error);

    res.status(500).send("ERROR");

  }

});


// =========================
// VER TOKENS
// =========================

app.get("/tokens", async (req, res) => {

  try {

    const snapshot =
      await db.collection("tokens").get();

    const tokens =
      snapshot.docs.map(doc => doc.id);

    res.json(tokens);

  } catch (error) {

    console.error(error);

    res.status(500).send(error.message);

  }

});


// =========================
// ENVIAR NOTIFICACIÓN
// =========================

app.post("/send", async (req, res) => {

  try {

const {
  token,
  title,
  body,
  tipo
} = req.body;

    const titulo =
      title || "🚨 LINCE247";
const contenido =
  body || "Nueva alerta";

const esAlertaAdmin = tipo === "admin";



// =========================
// ENVIAR A UN SOLO CELULAR
// =========================

    if (token) {

      const message = {

        notification: {
          title: titulo,
          body: contenido
        },

        data: {
          title: titulo,
          body: contenido,
          url: "https://lince247.com/"
        },

  android: {

  priority: "high",

  notification: {
    sound: esAlertaAdmin ? "default" : null,
    channelId: esAlertaAdmin ? "lince247_alertas" : "lince247_silencioso",
    defaultSound: esAlertaAdmin,
    defaultVibrateTimings: esAlertaAdmin
  }

},

        webpush: {

          headers: {
            Urgency: "high"
          },

          notification: {
            title: titulo,
            body: contenido,
            icon: "https://lince247.com/lince2-192.png",
            badge: "https://lince247.com/lince2-192.png"
          }

        },

        token: token

      };

      const response =
        await admin.messaging().send(message);

      console.log("✅ Notificación enviada:", response);

      return res.json({
        success: true,
        response: response
      });

    }


// =========================
// ENVIAR A TODOS
// =========================

    const snapshot =
      await db.collection("tokens").get();

    const tokens =
      snapshot.docs.map(doc => doc.id);

    if (tokens.length === 0) {

      return res.send("❌ No hay tokens");

    }


// Firebase permite máximo 500 tokens por multicast.
// Los enviamos en grupos de 500.

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < tokens.length; i += 500) {

      const grupo =
        tokens.slice(i, i + 500);

      const message = {

        notification: {
          title: titulo,
          body: contenido
        },

        data: {
          title: titulo,
          body: contenido,
          url: "https://lince247.com/"
        },

  android: {

  priority: "high",

  notification: {
    sound: esAlertaAdmin ? "default" : null,
    channelId: esAlertaAdmin ? "lince247_alertas" : "lince247_silencioso",
    defaultSound: esAlertaAdmin,
    defaultVibrateTimings: esAlertaAdmin
  }

},

        webpush: {

          headers: {
            Urgency: "high"
          },

          notification: {
            title: titulo,
            body: contenido,
            icon: "https://lince247.com/lince2-192.png",
            badge: "https://lince247.com/lince2-192.png"
          }

        },

        tokens: grupo

      };

      const response =
        await admin.messaging()
          .sendEachForMulticast(message);

      response.responses.forEach((r, index) => {

  if (!r.success) {

    console.error(
      "❌ Token rechazado:",
      grupo[index],
      "| Código:",
      r.error?.code,
      "| Mensaje:",
      r.error?.message
    );

  }

});

      successCount += response.successCount;
      failureCount += response.failureCount;

    }

console.log(
  "Enviadas: " + successCount + " | Fallidas: " + failureCount
);

    res.json({

      success: successCount,

      failure: failureCount

    });

  } catch (error) {

    console.error(
      "❌ Error enviando notificación:",
      error
    );

    res.status(500).send(error.message);

  }

});


// =========================
// HOME
// =========================

app.get("/", (req, res) => {

  res.json({

    status: "ok",

    message: "Backend Lince247 activo",

    routes: [
      "/save-token",
      "/tokens",
      "/send"
    ]

  });

});


// =========================
// SERVIDOR
// =========================

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    "🚀 Backend Lince247 listo en puerto " + PORT
  );

});
