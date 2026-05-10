// routes/jobs.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/jobs.controller');
const { requireLogin, requireRole } = require('../middleware/auth');
const { jobRules, validate } = require('../middleware/validate');

// Freelancer
router.get('/freelancer/browse',       requireLogin, requireRole('freelancer'), ctrl.browse);
router.get('/jobs/:id',                requireLogin, ctrl.detail);
router.get('/api/jobs/search',         ctrl.apiSearch);

// Client
router.get('/client/jobs',             requireLogin, requireRole('client'), ctrl.clientJobs);
router.get('/client/post-job',         requireLogin, requireRole('client'), ctrl.getPostJob);
router.post('/client/post-job',        requireLogin, requireRole('client'), jobRules, validate, ctrl.postJob);
router.get('/client/jobs/:id/edit',    requireLogin, requireRole('client'), ctrl.getEditJob);
router.post('/client/jobs/:id/edit',   requireLogin, requireRole('client'), jobRules, validate, ctrl.postEditJob);
router.post('/client/jobs/:id/delete', requireLogin, requireRole('client'), ctrl.deleteJob);

module.exports = router;
