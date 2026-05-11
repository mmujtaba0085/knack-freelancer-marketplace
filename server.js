// server.js — Knack entry point
require('dotenv').config();
const express       = require('express');
const session       = require('express-session');
const flash         = require('connect-flash');
const path          = require('path');
const mountRoutes   = require('./routes/index');
const { attachUser } = require('./middleware/auth');

const app = express();

// Trust one proxy hop (Caddy / Nginx) so req.ip reflects the real client IP.
// Without this, all users share the same rate-limit bucket behind a reverse proxy.
app.set('trust proxy', 1);

// ─── View engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── Session (Criterion 21–22) ────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'knack_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,           // prevents JS access to cookie
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30,  // 30-minute inactivity expiry
  },
}));

// ─── Flash messages ───────────────────────────────────────────────────────────
app.use(flash());

// ─── Attach session user to every view ───────────────────────────────────────
app.use(attachUser);

// ─── Routes ───────────────────────────────────────────────────────────────────
mountRoutes(app);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('shared/404', { user: req.session });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('shared/error', { user: req.session, message: 'Something went wrong on our end.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  ✦ Knack running → http://localhost:${PORT}\n`);
});
