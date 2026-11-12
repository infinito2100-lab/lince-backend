require("dotenv").config();

const express = require("express");
const admin = require("firebase-admin");

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
   if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

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
// GUARDAR TOKEN DEL ADMINISTRADOR
// =========================

const administradores = ["catgar7@hotmail.com"];

app.post("/save-admin-token", async (req, res) => {

  try {

    const token = req.body?.token;
    const autorizacion = req.headers.authorization || "";

    if (!token) {
      return res.status(400).json({ error: "Falta el token del dispositivo." });
    }

    if (!autorizacion.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado." });
    }

    const idToken = autorizacion.split("Bearer ")[1];
    const usuario = await admin.auth().verifyIdToken(idToken);

    const email = (usuario.email || "").toLowerCase();

    if (!administradores.includes(email)) {
      return res.status(403).json({ error: "No eres administrador." });
    }

await db.collection("adminTokens").doc(token).set({
  token: token,
  email: email,
  sonido: true,
  createdAt: admin.firestore.FieldValue.serverTimestamp()
}, { merge: true });

    console.log("✅ Dispositivo administrador registrado:", email);

    res.json({ success: true });

  } catch (error) {

    console.error("❌ Error guardando token admin:", error);

    res.status(500).json({ error: "No se pudo registrar el dispositivo." });

  }

});

// =========================
// CAMBIAR SONIDO DEL ADMINISTRADOR
// =========================

app.post("/set-admin-sound", async (req, res) => {

  try {

    const { token, sonido } = req.body;
    const autorizacion = req.headers.authorization || "";

    if (!token || typeof sonido !== "boolean") {
      return res.status(400).json({ error: "Datos incompletos." });
    }

    if (!autorizacion.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado." });
    }

    const idToken = autorizacion.split("Bearer ")[1];
    const usuario = await admin.auth().verifyIdToken(idToken);

    const email = (usuario.email || "").toLowerCase();

    if (!administradores.includes(email)) {
      return res.status(403).json({ error: "No eres administrador." });
    }

    const dispositivo = await db.collection("adminTokens").doc(token).get();

    if (!dispositivo.exists || dispositivo.data().email !== email) {
      return res.status(404).json({ error: "Dispositivo no encontrado." });
    }

    await dispositivo.ref.update({
      sonido: sonido
    });

    res.json({ success: true, sonido: sonido });

  } catch (error) {

    console.error("Error cambiando sonido:", error);

    res.status(500).json({ error: error.message });

  }

});

// =========================
// NOTIFICAR NUEVO USUARIO AL ADMINISTRADOR
// =========================

app.post("/notify-new-user", async (req, res) => {

  try {

    const usuarioId = req.body?.usuarioId;

    if (!usuarioId || typeof usuarioId !== "string") {
      return res.status(400).json({ error: "Falta el ID del usuario." });
    }

    // Comprobar que el usuario realmente existe en Firestore.

    const usuarioRef = db.collection("usuarios125").doc(usuarioId);
    const usuarioDoc = await usuarioRef.get();

    if (!usuarioDoc.exists) {
      return res.status(404).json({ error: "El usuario no existe." });
    }

    // Evitar notificar dos veces por el mismo registro.

    const avisoRef = db.collection("adminNotifiedUsers").doc(usuarioId);
    const avisoDoc = await avisoRef.get();

    if (avisoDoc.exists) {
      return res.json({
        success: true,
        message: "Este registro ya fue notificado."
      });
    }

    const datosUsuario = usuarioDoc.data();

    const nombre = datosUsuario.nombre || "Nuevo usuario";

    const snapshot = await db.collection("adminTokens").get();

    const tokens = snapshot.docs.map(doc => doc.id);

    if (tokens.length === 0) {
      return res.status(404).json({
        error: "No hay dispositivos administradores registrados."
      });
    }

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < tokens.length; i += 500) {

      const grupo = tokens.slice(i, i + 500);

      const mensaje = {
        data: {
          title: "🔔 LINCE247",
          body: "Nuevo usuario registrado: " + nombre,
          url: "https://lince247.com/admin125.html",
          tipo: "nuevo_usuario"
        },

        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "lince247_alertas",
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },

        webpush: {
          headers: {
            Urgency: "high"
          }
        },

        tokens: grupo
      };

      const respuesta = await admin.messaging()
        .sendEachForMulticast(mensaje);

      successCount += respuesta.successCount;
      failureCount += respuesta.failureCount;

    }

    if (successCount > 0) {

      await avisoRef.set({
        usuarioId: usuarioId,
        nombre: nombre,
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        notificacionesEnviadas: successCount
      });

    }

    console.log(
      "🔔 Alerta de nuevo usuario. Enviadas:",
      successCount,
      "| Fallidas:",
      failureCount
    );

    res.json({
      success: successCount > 0,
      enviados: successCount,
      fallidos: failureCount
    });

  } catch (error) {

    console.error("❌ Error notificando al administrador:", error);

    res.status(500).json({ error: error.message });

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
  "/send",
  "/save-admin-token",
  "/notify-new-user"
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
