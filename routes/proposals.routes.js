// routes/proposals.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/proposals.controller');
const { requireLogin, requireRole } = require('../middleware/auth');
const { proposalRules, validate } = require('../middleware/validate');
const db      = require('../config/db');

// Freelancer apply page
router.get('/jobs/:jobId/apply', requireLogin, requireRole('freelancer'), async (req, res) => {
  const [rows] = await db.query(
    'SELECT j.*, u.name AS client_name FROM jobs j JOIN users u ON j.client_id=u.id WHERE j.id=? AND j.status="open"',
    [req.params.jobId]
  );
  if (!rows.length) return res.redirect('/freelancer/browse');
  res.render('freelancer/apply', { job: rows[0], errors: [], body: {}, user: req.session });
});

router.post('/jobs/:jobId/apply',        requireLogin, requireRole('freelancer'), proposalRules, validate, ctrl.submit);
router.get('/freelancer/applications',   requireLogin, requireRole('freelancer'), ctrl.myApplications);
router.get('/client/proposals/:jobId',   requireLogin, requireRole('client'), ctrl.viewForJob);
router.post('/proposals/:id/accept',     requireLogin, requireRole('client'), ctrl.accept);
router.post('/proposals/:id/reject',     requireLogin, requireRole('client'), ctrl.reject);

module.exports = router;
