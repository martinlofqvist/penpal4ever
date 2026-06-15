/**
 * PenPal4ever — server.js
 *
 * Express backend (ESM):
 *  - Serves static files (HTML, CSS, JS)
 *  - REST API for penpal sessions and image uploads
 *  - Neon PostgreSQL via pg
 *
 * Run: node server.js  (or: pnpm server)
 */

import 'dotenv/config';
import express        from 'express';
import pg             from 'pg';
import multer         from 'multer';
import { nanoid }     from 'nanoid';
import path           from 'path';
import fs             from 'fs';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3000;

// ─── DB ──────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS penpal_sessions (
      id                TEXT PRIMARY KEY,
      your_first_name   TEXT NOT NULL,
      your_last_name    TEXT NOT NULL,
      your_email        TEXT NOT NULL,
      penpal_first_name TEXT NOT NULL,
      penpal_last_name  TEXT NOT NULL,
      penpal_email      TEXT NOT NULL,
      limit_themes      BOOLEAN DEFAULT FALSE,
      max_themes        INTEGER,
      current_theme_index INTEGER DEFAULT 0,
      created_at        TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id          SERIAL PRIMARY KEY,
      session_id  TEXT NOT NULL REFERENCES penpal_sessions(id) ON DELETE CASCADE,
      theme_index INTEGER NOT NULL,
      person      TEXT NOT NULL CHECK (person IN ('left', 'right')),
      image_url   TEXT NOT NULL,
      caption     TEXT,
      uploaded_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS uploads_session_idx ON uploads(session_id);
  `);
  console.log('✓ DB schema ready');
}

// ─── Uploads dir ─────────────────────────────────────────────

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${nanoid(6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpeg|jpg|png|gif|webp|avif)/.test(file.mimetype);
    cb(ok ? null : new Error('Images only'), ok);
  },
});

// ─── Middleware ───────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(__dirname, { index: 'index.html', extensions: ['html'] }));

// ─── API ─────────────────────────────────────────────────────

// POST /api/sessions
app.post('/api/sessions', async (req, res) => {
  try {
    const { yourFirstName, yourLastName, yourEmail,
            penpalFirstName, penpalLastName, penpalEmail,
            limitThemes, maxThemes } = req.body;

    if (!yourFirstName || !yourLastName || !yourEmail ||
        !penpalFirstName || !penpalLastName || !penpalEmail) {
      return res.status(400).json({ error: 'All name and email fields are required' });
    }

    const id = nanoid(8);
    await pool.query(
      `INSERT INTO penpal_sessions
         (id, your_first_name, your_last_name, your_email,
          penpal_first_name, penpal_last_name, penpal_email,
          limit_themes, max_themes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [ id,
        yourFirstName.trim(), yourLastName.trim(), yourEmail.trim().toLowerCase(),
        penpalFirstName.trim(), penpalLastName.trim(), penpalEmail.trim().toLowerCase(),
        !!limitThemes, limitThemes ? (parseInt(maxThemes, 10) || null) : null ],
    );

    res.json({ id, url: `/session/${id}` });
  } catch (err) {
    console.error('POST /api/sessions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sessions/lookup/email  — must be before /:id
app.get('/api/sessions/lookup/email', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'email param required' });

    const { rows } = await pool.query(
      `SELECT * FROM penpal_sessions
       WHERE your_email = $1 OR penpal_email = $1
       ORDER BY created_at DESC LIMIT 1`,
      [email],
    );

    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/sessions/lookup/email:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sessions/:id
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const { rows: s } = await pool.query(
      'SELECT * FROM penpal_sessions WHERE id = $1', [req.params.id]);
    if (!s.length) return res.status(404).json({ error: 'Not found' });

    const { rows: u } = await pool.query(
      'SELECT * FROM uploads WHERE session_id = $1 ORDER BY theme_index, uploaded_at',
      [req.params.id]);

    res.json({ session: s[0], uploads: u });
  } catch (err) {
    console.error('GET /api/sessions/:id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/sessions/:id/theme
app.put('/api/sessions/:id/theme', async (req, res) => {
  try {
    await pool.query(
      'UPDATE penpal_sessions SET current_theme_index = $1 WHERE id = $2',
      [parseInt(req.body.themeIndex, 10), req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/sessions/:id/theme:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sessions/:id/upload
app.post('/api/sessions/:id/upload', upload.single('image'), async (req, res) => {
  try {
    const { rows: s } = await pool.query(
      'SELECT id FROM penpal_sessions WHERE id = $1', [req.params.id]);
    if (!s.length) return res.status(404).json({ error: 'Session not found' });

    const { themeIndex, person, caption } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;

    await pool.query(
      'DELETE FROM uploads WHERE session_id=$1 AND theme_index=$2 AND person=$3',
      [req.params.id, parseInt(themeIndex, 10), person]);

    const { rows } = await pool.query(
      `INSERT INTO uploads (session_id, theme_index, person, image_url, caption)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, parseInt(themeIndex, 10), person, imageUrl, caption || '']);

    res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/sessions/:id/upload:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// /session/:id → serve theme.html (JS reads session from URL)
app.get('/session/:id', (_req, res) => {
  res.sendFile(path.join(__dirname, 'theme.html'));
});

// ─── Start ───────────────────────────────────────────────────

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 PenPal4ever running at http://localhost:${PORT}\n`);
  });
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
