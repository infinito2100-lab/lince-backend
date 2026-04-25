const express = require("express");
const fs = require("fs");
const path = require("path");

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

// 🔹 CHECK SERVER
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend activo",
    routes: ["/save-token", "/tokens"]
  });
});

// PORT Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Backend listo en puerto " + PORT);
});