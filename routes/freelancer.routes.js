// routes/freelancer.routes.js
const express = require('express');
const router  = express.Router();
const dashCtrl  = require('../controllers/dashboard.controller');
const jobsCtrl  = require('../controllers/jobs.controller');
const offerCtrl = require('../controllers/offers.controller');
const { requireLogin, requireRole } = require('../middleware/auth');

const guard = [requireLogin, requireRole('freelancer')];

router.get('/',             ...guard, (req, res) => res.redirect('/freelancer/dashboard'));
router.get('/dashboard',    ...guard, dashCtrl.freelancerDashboard);
router.get('/browse',       ...guard, jobsCtrl.browse);
router.get('/saved-jobs',   ...guard, jobsCtrl.savedJobs);
router.post('/jobs/:id/save',...guard, jobsCtrl.toggleSave);
router.get('/offers',       ...guard, offerCtrl.freelancerOffers);
router.post('/offers/:id/respond', ...guard, offerCtrl.respondOffer);

module.exports = router;
