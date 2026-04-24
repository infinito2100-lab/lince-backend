const express = require("express");
const fs = require("fs");
const app = express();

// ✅ SOLUCIÓN CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

app.use(express.json());

app.post("/save-token", (req, res) => {
  const token = req.body.token;

  if (!token) return res.sendStatus(400);

  let tokens = [];

  if (fs.existsSync("tokens.txt")) {
    tokens = fs.readFileSync("tokens.txt", "utf8")
      .split("\n")
      .filter(Boolean);
  }

  if (!tokens.includes(token)) {
    tokens.push(token);
    fs.writeFileSync("tokens.txt", tokens.join("\n"));
  }

  res.send("OK");
});

app.listen(3000, () => {
  console.log("Backend listo en puerto 3000");
});