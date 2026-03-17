const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const codes = new Map();
const sessions = new Map();

function makeCode() {
  return "LM-" + Math.floor(10000 + Math.random() * 90000);
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "LazyMan API" });
});

app.post("/plugin/connect-code", (req, res) => {
  const code = makeCode();

  codes.set(code, {
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  res.json({ ok: true, code });
});

app.post("/plugin/connect", (req, res) => {
  const { code } = req.body || {};
  const row = codes.get(code);

  if (!row) {
    return res.status(400).json({ ok: false });
  }

  const token = makeToken();

  sessions.set(token, {
    lastHeartbeat: Date.now()
  });

  res.json({ ok: true, token });
});

app.post("/plugin/heartbeat", (req, res) => {
  const { token } = req.body || {};
  const s = sessions.get(token);

  if (!s) return res.status(401).json({ ok: false });

  s.lastHeartbeat = Date.now();
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("LazyMan API running");
});
