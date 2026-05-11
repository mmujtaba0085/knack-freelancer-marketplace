// middleware/rateLimiter.js — Brute-force protection
const rateLimit = require('express-rate-limit');

// Behind Caddy/Nginx, read the real client IP from X-Forwarded-For directly.
// express-rate-limit v7 needs an explicit keyGenerator when behind a proxy,
// otherwise all requests share the same bucket (the proxy IP).
const realIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: realIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error', 'Too many login attempts. Please try again in 15 minutes.');
    res.redirect('/login');
  }
});

exports.signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  keyGenerator: realIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error', 'Too many accounts created from this IP. Please try again in an hour.');
    res.redirect('/signup');
  }
});
