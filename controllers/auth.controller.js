// controllers/auth.controller.js
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const db      = require('../config/db');
const mailer  = require('../config/mailer');

const SALT_ROUNDS = 12;

// ─── GET /login ───────────────────────────────────────────────────────────────
exports.getLogin = (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('auth/login', { errors: [], body: {} });
};

// ─── POST /login ──────────────────────────────────────────────────────────────
exports.postLogin = async (req, res) => {
  if (req.validationErrors) {
    return res.render('auth/login', { errors: req.validationErrors, body: req.body });
  }
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [req.body.email]);
    if (!rows.length) {
      return res.render('auth/login', { errors: [{ msg: 'Invalid email or password' }], body: req.body });
    }
    const user = rows[0];
    if (!user.is_active) {
      return res.render('auth/login', { errors: [{ msg: 'Your account has been deactivated. Contact support.' }], body: req.body });
    }
    // Criterion 6: use bcrypt.compare, NEVER string equality
    const match = await bcrypt.compare(req.body.password, user.password_hash);
    if (!match) {
      return res.render('auth/login', { errors: [{ msg: 'Invalid email or password' }], body: req.body });
    }
    // Criterion 21: regenerate session on login (prevents session fixation)
    const returnTo = req.session.returnTo;
    req.session.regenerate((err) => {
      if (err) return res.redirect('/login');
      req.session.userId    = user.id;
      req.session.userName  = user.name;
      req.session.role      = user.role;
      req.session.avatarUrl = user.avatar_url || null;
      req.session.save(() => {
        const redirectMap = { admin: '/admin', client: '/client/dashboard', freelancer: '/freelancer/dashboard' };
        res.redirect(returnTo || redirectMap[user.role] || '/dashboard');
      });
    });
  } catch (e) {
    console.error(e);
    res.render('auth/login', { errors: [{ msg: 'Something went wrong. Please try again.' }], body: req.body });
  }
};

// ─── GET /signup ──────────────────────────────────────────────────────────────
exports.getSignup = (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('auth/signup', { errors: [], body: {} });
};

// ─── POST /signup ─────────────────────────────────────────────────────────────
exports.postSignup = async (req, res) => {
  if (req.validationErrors) {
    return res.render('auth/signup', { errors: req.validationErrors, body: req.body });
  }
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [req.body.email]);
    if (existing.length) {
      return res.render('auth/signup', {
        errors: [{ msg: 'An account with this email already exists', path: 'email' }],
        body: req.body
      });
    }
    // Criterion 4+5: hash password immediately; raw password never stored
    const hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [req.body.name, req.body.email, hash, req.body.role]
    );
    req.session.regenerate((err) => {
      if (err) return res.redirect('/login');
      req.session.userId   = result.insertId;
      req.session.userName = req.body.name;
      req.session.role     = req.body.role;
      req.session.save(() => {
        req.flash('success', `Welcome to Knack, ${req.body.name}!`);
        const redirectMap = { client: '/client/dashboard', freelancer: '/freelancer/dashboard' };
        res.redirect(redirectMap[req.body.role] || '/dashboard');
      });
    });
  } catch (e) {
    console.error(e);
    res.render('auth/signup', { errors: [{ msg: 'Registration failed. Please try again.' }], body: req.body });
  }
};

// ─── GET /logout ──────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

// ─── GET /forgot-password ─────────────────────────────────────────────────────
exports.getForgot = (req, res) => {
  res.render('auth/forgot', { errors: [], body: {}, sent: false });
};

// ─── POST /forgot-password ────────────────────────────────────────────────────
exports.postForgot = async (req, res) => {
  if (req.validationErrors) {
    return res.render('auth/forgot', { errors: req.validationErrors, body: req.body, sent: false });
  }
  try {
    const [rows] = await db.query('SELECT id, name FROM users WHERE email = ? LIMIT 1', [req.body.email]);
    // Always show "sent" to prevent email enumeration
    if (!rows.length) {
      return res.render('auth/forgot', { errors: [], body: req.body, sent: true });
    }
    const user = rows[0];
    const rawToken  = crypto.randomBytes(32).toString('hex');
    // Criterion 7: hash the token before storing — raw token only sent by email
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?,?,?)',
      [user.id, tokenHash, expiresAt]
    );
    const link = `${process.env.BASE_URL}/reset-password?uid=${user.id}&token=${rawToken}`;
    await mailer.sendResetEmail(req.body.email, user.name, link);
    res.render('auth/forgot', { errors: [], body: req.body, sent: true });
  } catch (e) {
    console.error(e);
    res.render('auth/forgot', { errors: [{ msg: 'Could not send reset email. Try again.' }], body: req.body, sent: false });
  }
};

// ─── GET /reset-password ──────────────────────────────────────────────────────
exports.getReset = async (req, res) => {
  const { uid, token } = req.query;
  if (!uid || !token) return res.redirect('/forgot-password');
  const [rows] = await db.query(
    'SELECT * FROM password_resets WHERE user_id = ? AND used = 0 AND expires_at > UTC_TIMESTAMP() ORDER BY id DESC LIMIT 1',
    [uid]
  );
  if (!rows.length) {
    return res.render('auth/reset', { errors: [{ msg: 'This link has expired or is invalid. Please request a new one.' }], uid, token, expired: true });
  }
  res.render('auth/reset', { errors: [], uid, token, expired: false });
};

// ─── POST /reset-password ─────────────────────────────────────────────────────
exports.postReset = async (req, res) => {
  const { uid, token } = req.body;
  if (req.validationErrors) {
    return res.render('auth/reset', { errors: req.validationErrors, uid, token, expired: false });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE user_id = ? AND used = 0 AND expires_at > UTC_TIMESTAMP() ORDER BY id DESC LIMIT 1',
      [uid]
    );
    if (!rows.length) {
      return res.render('auth/reset', { errors: [{ msg: 'Link expired. Request a new one.' }], uid, token, expired: true });
    }
    const valid = await bcrypt.compare(token, rows[0].token_hash);
    if (!valid) {
      return res.render('auth/reset', { errors: [{ msg: 'Invalid reset link.' }], uid, token, expired: true });
    }
    const newHash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, uid]);
    // Criterion 7: mark token as used (single-use)
    await db.query('UPDATE password_resets SET used = 1 WHERE id = ?', [rows[0].id]);
    req.flash('success', 'Password updated! Please sign in.');
    res.redirect('/login');
  } catch (e) {
    console.error(e);
    res.render('auth/reset', { errors: [{ msg: 'Something went wrong.' }], uid, token, expired: false });
  }
};
