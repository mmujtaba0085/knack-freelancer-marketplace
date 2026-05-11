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
    const match = await bcrypt.compare(req.body.password, user.password_hash);
    if (!match) {
      return res.render('auth/login', { errors: [{ msg: 'Invalid email or password' }], body: req.body });
    }
    if (!user.is_verified) {
      req.session.pendingVerifyId    = user.id;
      req.session.pendingVerifyEmail = user.email;
      req.session.pendingVerifyName  = user.name;
      req.session.pendingVerifyRole  = user.role;
      return req.session.save(() => res.redirect('/verify-email'));
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
    const hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, is_verified) VALUES (?, ?, ?, ?, 0)',
      [req.body.name, req.body.email, hash, req.body.role]
    );
    const userId = result.insertId;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.query('UPDATE users SET verify_code=?, verify_expires_at=? WHERE id=?', [code, expiresAt, userId]);
    try { await mailer.sendVerificationEmail(req.body.email, req.body.name, code); } catch (_) {}
    req.session.pendingVerifyId    = userId;
    req.session.pendingVerifyEmail = req.body.email;
    req.session.pendingVerifyName  = req.body.name;
    req.session.pendingVerifyRole  = req.body.role;
    req.session.save(() => res.redirect('/verify-email'));
  } catch (e) {
    console.error(e);
    res.render('auth/signup', { errors: [{ msg: 'Registration failed. Please try again.' }], body: req.body });
  }
};

// ─── GET /verify-email ────────────────────────────────────────────────────────
exports.getVerify = (req, res) => {
  if (!req.session.pendingVerifyId) return res.redirect('/signup');
  const email = req.session.pendingVerifyEmail || '';
  const masked = email.replace(/^(..)[^@]+/, '$1***');
  res.render('auth/verify-email', { error: null, masked });
};

// ─── POST /verify-email ───────────────────────────────────────────────────────
exports.postVerify = async (req, res) => {
  const userId = req.session.pendingVerifyId;
  if (!userId) return res.redirect('/signup');
  const masked = (req.session.pendingVerifyEmail || '').replace(/^(..)[^@]+/, '$1***');
  const entered = (req.body.code || '').trim();
  try {
    const [rows] = await db.query(
      'SELECT verify_code, verify_expires_at, role FROM users WHERE id=? AND is_verified=0',
      [userId]
    );
    if (!rows.length) {
      return res.render('auth/verify-email', { error: 'Account not found or already verified.', masked });
    }
    const { verify_code, verify_expires_at, role } = rows[0];
    if (new Date() > new Date(verify_expires_at)) {
      return res.render('auth/verify-email', { error: 'Code expired. Please request a new one.', masked });
    }
    if (entered !== verify_code) {
      return res.render('auth/verify-email', { error: 'Incorrect code. Please try again.', masked });
    }
    await db.query('UPDATE users SET is_verified=1, verify_code=NULL, verify_expires_at=NULL WHERE id=?', [userId]);
    const name = req.session.pendingVerifyName;
    req.session.regenerate((err) => {
      if (err) return res.redirect('/login');
      req.session.userId   = userId;
      req.session.userName = name;
      req.session.role     = role;
      req.session.save(() => {
        req.flash('success', `Welcome to Knack, ${name}!`);
        const redirectMap = { client: '/client/dashboard', freelancer: '/freelancer/dashboard' };
        res.redirect(redirectMap[role] || '/dashboard');
      });
    });
  } catch (e) {
    console.error(e);
    res.render('auth/verify-email', { error: 'Something went wrong. Please try again.', masked });
  }
};

// ─── POST /resend-code ────────────────────────────────────────────────────────
exports.postResendCode = async (req, res) => {
  const userId = req.session.pendingVerifyId;
  if (!userId) return res.redirect('/signup');
  const masked = (req.session.pendingVerifyEmail || '').replace(/^(..)[^@]+/, '$1***');
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.query('UPDATE users SET verify_code=?, verify_expires_at=? WHERE id=?', [code, expiresAt, userId]);
    try { await mailer.sendVerificationEmail(req.session.pendingVerifyEmail, req.session.pendingVerifyName, code); } catch (_) {}
    res.render('auth/verify-email', { error: null, masked, resent: true });
  } catch (e) {
    console.error(e);
    res.render('auth/verify-email', { error: 'Could not resend code. Try again.', masked });
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
