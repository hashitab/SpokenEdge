# 🎙️ SpokenEdge v2 — AI English Practice Platform

> **Selected for University Exhibition** — Built with Node.js, Groq AI, SQLite & Web Speech API

---

## ✨ What's New in v2

| Feature | Before | After |
|---|---|---|
| Speech Recognition | Basic, error-prone | Multi-alternative with confidence scoring |
| Storage | localStorage | SQLite database (persistent) |
| Admin Panel | ❌ None | ✅ Full dashboard with charts |
| Theme | Dark only | Dark + Light toggle |
| UI | Basic | Aesthetic with aurora effects |
| Fonts | Generic | Syne + Plus Jakarta Sans |
| Color scheme | Default | Mint/Violet/Coral/Amber palette |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your GROQ_KEY (already set)
```

### 3. Start the Server
```bash
npm start
# → Running at http://localhost:3000
# → Admin: http://localhost:3000 → ⚙️ button
```

---

## 🔑 Admin Panel Access

Default credentials (change in `.env`):
- **Username:** `admin`
- **Password:** `spokenedge@admin`

Access via the ⚙️ button in the top-right header.

### Admin Dashboard shows:
- Total sessions, unique users, average score, words spoken
- Daily session trend chart (14 days)
- Sessions by topic chart (doughnut)
- Full sessions table with delete functionality

---

## 🎤 Improved Speech Recognition

### Key fixes:
1. **Multi-alternative results** — `maxAlternatives: 5` picks the transcript with highest confidence score
2. **`continuous: false`** — Single utterance mode gives much better accuracy than continuous
3. **Interim results** — Live text preview while speaking so users know it's working
4. **Confidence display** — Each spoken message shows a clarity % bar
5. **Error handling** — Clear messages for mic blocked, no speech, network issues
6. **Language selector** — Switch between US/UK/AU/Indian English

### Tips for best accuracy:
- Use **Google Chrome** (best Web Speech API support)
- Speak in a **quiet environment**
- Hold mic **6-12 inches** from mouth
- Speak at a **natural, steady pace**
- Click mic once, speak, then click again to stop

---

## 📁 Project Structure

```
spokenedge/
├── server.js          # Express server + SQLite + Admin API
├── package.json       # Dependencies
├── .env               # API keys & config
├── spokenedge.db      # SQLite database (auto-created)
└── public/
    └── index.html     # Complete frontend (all-in-one)
```

---

## 🗄️ Database Schema

```sql
sessions  — id, user_name, topic, score, words_spoken, turns, duration_seconds, created_at
messages  — id, session_id, role, content, confidence, created_at
admin_users — id, username, password_hash, created_at
```

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `--mint` | `#00ffb3` | Primary accent, scores |
| `--violet` | `#a78bfa` | Secondary accent, grammar |
| `--coral` | `#ff6ec7` | Recording state, errors |
| `--amber` | `#ffd166` | Timer, warnings |
| Display font | Syne 800 | Headings, numbers |
| Body font | Plus Jakarta Sans | Body text |

---

## 🏆 Exhibition Highlights

1. **12 Practice Topics** — Job Interview → Daily Chat → Debate → Storytelling
2. **Live Score Ring** — Animated SVG ring with grammar/vocab/fluency/confidence breakdown
3. **Session History** — Persistent across browser sessions via database
4. **Dark/Light Theme** — Instant toggle with smooth transitions
5. **Aurora Background** — Layered radial gradients create depth
6. **No page reload** — Single-page app with smooth view transitions

---

## 📦 Tech Stack

- **Runtime:** Node.js 18+
- **Server:** Express.js
- **AI:** Groq API (Llama 3.3 70B)
- **Database:** SQLite via better-sqlite3
- **Auth:** JWT + bcryptjs
- **Charts:** Chart.js 4
- **Speech:** Web Speech API (browser native)
- **Fonts:** Google Fonts (Syne + Plus Jakarta Sans)

---

*Made with ❤️ for the university exhibition*
