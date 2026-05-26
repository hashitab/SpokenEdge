require("dotenv").config();
const express = require("express");
const path    = require("path");
const fs      = require("fs");
const fetch   = (...a) => import("node-fetch").then(({ default: f }) => f(...a));
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET       = process.env.JWT_SECRET       || "spokenedge-secret-2025";
const ADMIN_USER       = process.env.ADMIN_USER       || "admin";
const ADMIN_PASS       = process.env.ADMIN_PASS       || "spokenedge@admin";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const DB_FILE          = path.join(__dirname, "data.json");

// ─── JSON Database ────────────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const init = { sessions: [], admins: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
    return init;
  }
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return { sessions: [], admins: [] }; }
}
function writeDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

// Seed admin
const db0 = readDB();
if (!db0.admins.find(a => a.username === ADMIN_USER)) {
  db0.admins.push({ id: 1, username: ADMIN_USER, password_hash: bcrypt.hashSync(ADMIN_PASS, 10) });
  writeDB(db0);
  console.log("✅ Admin created: " + ADMIN_USER + " / " + ADMIN_PASS);
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));

// Serve index.html with GOOGLE_CLIENT_ID injected
app.get("/", (req, res) => serveIndex(res));
app.get("/index.html", (req, res) => serveIndex(res));

function serveIndex(res) {
  const indexPath = path.join(__dirname, "public", "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  // Inject client ID as a global JS variable before </head>
  const injection = `<script>window.GOOGLE_CLIENT_ID = "${GOOGLE_CLIENT_ID}";</script>`;
  html = html.replace("</head>", injection + "\n</head>");
  res.setHeader("Content-Type", "text/html");
  res.send(html);
}

// Serve other static files normally
app.use(express.static(path.join(__dirname, "public")));

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try { req.admin = jwt.verify(auth.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid token" }); }
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const KEY = process.env.GROQ_KEY;
  if (!KEY) return res.status(500).json({ error: "GROQ_KEY missing from .env" });
  const { messages, system, maxTokens = 1200 } = req.body;
  if (!Array.isArray(messages)) return res.status(400).json({ error: "Bad request." });
  const groqMessages = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
  ];
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: groqMessages, max_tokens: maxTokens, temperature: 0.8 }),
    });
    const data = await r.json();
    if (data.error) return res.status(502).json({ error: data.error.message });
    const text = data.choices?.[0]?.message?.content || "";
    if (!text) return res.status(502).json({ error: "Empty response from AI." });
    res.json({ text });
  } catch (e) { res.status(502).json({ error: "Could not reach AI: " + e.message }); }
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
app.post("/api/sessions", (req, res) => {
  const { user_name="Guest", topic="General", score=0, words_spoken=0, turns=0, duration_seconds=0 } = req.body;
  const db = readDB();
  const id = db.sessions.length > 0 ? Math.max(...db.sessions.map(s => s.id)) + 1 : 1;
  db.sessions.push({ id, user_name, topic, score, words_spoken, turns, duration_seconds, created_at: new Date().toISOString() });
  writeDB(db);
  res.json({ success: true, session_id: id });
});

app.get("/api/sessions/my", (req, res) => {
  const { user_name } = req.query;
  if (!user_name) return res.json([]);
  const db = readDB();
  res.json(db.sessions.filter(s => s.user_name === user_name).reverse().slice(0, 20));
});

// ─── Admin Auth ───────────────────────────────────────────────────────────────
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const u = db.admins.find(a => a.username === username);
  if (!u || !bcrypt.compareSync(password, u.password_hash))
    return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: u.id, username: u.username }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, username: u.username });
});

// ─── Admin Stats ──────────────────────────────────────────────────────────────
app.get("/api/admin/stats", requireAdmin, (req, res) => {
  const db = readDB();
  const sessions = db.sessions;
  const total_sessions = sessions.length;
  const total_users    = new Set(sessions.map(s => s.user_name)).size;
  const avg_score      = sessions.length ? +(sessions.reduce((a,s)=>a+(s.score||0),0)/sessions.length).toFixed(1) : 0;
  const total_words    = sessions.reduce((a,s)=>a+(s.words_spoken||0),0);
  const today          = new Date().toDateString();
  const today_sessions = sessions.filter(s=>new Date(s.created_at).toDateString()===today).length;
  const topicMap = {};
  sessions.forEach(s=>{ if(!topicMap[s.topic])topicMap[s.topic]={count:0,ts:0}; topicMap[s.topic].count++; topicMap[s.topic].ts+=s.score||0; });
  const by_topic = Object.entries(topicMap).map(([topic,v])=>({topic,count:v.count,avg_score:+(v.ts/v.count).toFixed(1)})).sort((a,b)=>b.count-a.count).slice(0,8);
  const dayMap = {};
  sessions.forEach(s=>{ const d=s.created_at?.slice(0,10); if(!dayMap[d])dayMap[d]={sessions:0,ts:0}; dayMap[d].sessions++; dayMap[d].ts+=s.score||0; });
  const daily_trend = Object.entries(dayMap).map(([day,v])=>({day,sessions:v.sessions,avg_score:+(v.ts/v.sessions).toFixed(1)})).sort((a,b)=>b.day.localeCompare(a.day)).slice(0,14);
  res.json({ total_sessions, total_users, avg_score, total_words, today_sessions, by_topic, recent_sessions: sessions.slice(-50).reverse(), daily_trend });
});

app.delete("/api/admin/sessions/:id", requireAdmin, (req, res) => {
  const db = readDB();
  db.sessions = db.sessions.filter(s => s.id !== parseInt(req.params.id));
  writeDB(db);
  res.json({ success: true });
});

// ─── Catch-all ────────────────────────────────────────────────────────────────
app.get("*", (_, res) => serveIndex(res));

app.listen(PORT, () => {
  console.log("\n🚀 SpokenEdge running → http://localhost:" + PORT);
  console.log("🔑 Admin: " + ADMIN_USER + " / " + ADMIN_PASS);
  if (GOOGLE_CLIENT_ID) console.log("✅ Google OAuth: enabled");
  else console.log("⚠️  Google OAuth: disabled (add GOOGLE_CLIENT_ID to .env)");
  console.log("📦 Data: data.json\n");
});
