const express = require("express");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const db = admin.firestore();

const app = express();

// ✔️ JSON primero
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});


// 🔥 FIREBASE ADMIN (CORREGIDO Y SEGURO)
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("❌ Falta FIREBASE_SERVICE_ACCOUNT en Render");
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// 📁 ruta segura
const TOKEN_FILE = path.join(__dirname, "tokens.txt");


// 🔹 SAVE TOKEN
app.post("/save-token", (req, res) => {
  const token = req.body?.token;

  if (!token) {
    console.log("❌ Token vacío o no recibido");
    return res.status(400).send("NO TOKEN");
  }

  let tokens = [];

  if (fs.existsSync(TOKEN_FILE)) {
    tokens = fs.readFileSync(TOKEN_FILE, "utf8")
      .split("\n")
      .filter(Boolean);
  }

  if (!tokens.includes(token)) {
    tokens.push(token);
    fs.writeFileSync(TOKEN_FILE, tokens.join("\n"));
  }

  console.log("📥 Token guardado:", token);
  console.log("📊 Total tokens:", tokens.length);

  res.send("OK");
});


// 🔹 VER TOKENS
app.get("/tokens", (req, res) => {
  let tokens = [];

  if (fs.existsSync(TOKEN_FILE)) {
    tokens = fs.readFileSync(TOKEN_FILE, "utf8")
      .split("\n")
      .filter(Boolean);
  }

  res.json(tokens);
});


// 🧹 UPDATE TOKENS
app.post("/update-tokens", (req, res) => {
  const tokens = req.body?.tokens;

  if (!tokens) {
    console.log("❌ No llegaron tokens para actualizar");
    return res.status(400).send("NO TOKENS");
  }

  fs.writeFileSync(TOKEN_FILE, tokens.join("\n"));

  console.log("🧹 Tokens actualizados");
  console.log("📊 Nuevos tokens:", tokens.length);

  res.send("OK");
});


// 🔔 ENVIAR NOTIFICACIÓN
app.get("/send", async (req, res) => {
  let tokens = [];

  if (fs.existsSync(TOKEN_FILE)) {
    tokens = fs.readFileSync(TOKEN_FILE, "utf8")
      .split("\n")
      .filter(Boolean);
  }

  if (tokens.length === 0) {
    return res.send("❌ No hay tokens");
  }

  const message = {
    notification: {
      title: "Prueba",
      body: "Hola desde backend"
    },
    token: tokens[0]
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Enviado:", response);
    res.send(response);
  } catch (error) {
    console.log("❌ Error:", error);
    res.status(500).send(error.message);
  }
});


// 🔹 CHECK SERVER
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend activo",
    routes: ["/save-token", "/tokens", "/update-tokens", "/send"]
  });
});


// PORT Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Backend listo en puerto " + PORT);
});