// routes/pages.routes.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireLogin } = require('../middleware/auth');
const { contactRules, validate } = require('../middleware/validate');

// Dashboard redirect
router.get('/dashboard', requireLogin, (req, res) => {
  const map = { admin: '/admin', client: '/client/dashboard', freelancer: '/freelancer/dashboard' };
  res.redirect(map[req.session.role] || '/login');
});

// Public pages
router.get('/', async (req, res) => {
  const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
  const [featuredFreelancers] = await db.query(`
    SELECT u.*, COALESCE(AVG(r.rating),0) AS avg_rating, COUNT(DISTINCT ct.id) AS completed_jobs
    FROM users u
    LEFT JOIN reviews r ON r.reviewee_id=u.id
    LEFT JOIN contracts ct ON ct.freelancer_id=u.id AND ct.status='completed'
    WHERE u.role='freelancer' AND u.is_active=1
    GROUP BY u.id ORDER BY avg_rating DESC, completed_jobs DESC LIMIT 4
  `);
  const [[counts]] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role='freelancer' AND is_active=1) AS freelancer_count,
      (SELECT COUNT(*) FROM jobs WHERE status='open') AS open_jobs,
      (SELECT COUNT(*) FROM contracts WHERE status='completed') AS completed_contracts
  `);
  res.render('shared/home', { categories, featuredFreelancers, counts, user: req.session });
});

router.get('/about', (req, res) => res.render('shared/about', { user: req.session }));

router.get('/contact', (req, res) => res.render('shared/contact', { user: req.session, errors: [], body: {}, sent: false }));
router.post('/contact', contactRules, validate, async (req, res) => {
  if (req.validationErrors) {
    return res.render('shared/contact', { user: req.session, errors: req.validationErrors, body: req.body, sent: false });
  }
  // In a real deployment you'd email this; we just flash success
  res.render('shared/contact', { user: req.session, errors: [], body: {}, sent: true });
});

module.exports = router;
