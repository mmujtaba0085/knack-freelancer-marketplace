// routes/contracts.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/contracts.controller');
const { requireLogin, requireRole } = require('../middleware/auth');
const { reviewRules, validate } = require('../middleware/validate');

router.get('/client/contracts',                       requireLogin, requireRole('client'),     ctrl.clientContracts);
router.get('/freelancer/contracts',                   requireLogin, requireRole('freelancer'), ctrl.freelancerContracts);
router.get('/contracts/:id',                          requireLogin,                            ctrl.detail);
router.post('/contracts/:id/milestone',               requireLogin,                            ctrl.updateMilestone);
router.post('/contracts/:id/deliverable',             requireLogin, requireRole('freelancer'), ctrl.upload.single('file'), ctrl.submitDeliverable);
router.post('/contracts/:id/deliverable/review',      requireLogin, requireRole('client'),     ctrl.reviewDeliverable);
router.post('/contracts/:id/review',                  requireLogin, reviewRules, validate,     ctrl.submitReview);
router.post('/contracts/:id/dispute',                 requireLogin,                            ctrl.raiseDispute);
router.post('/contracts/:id/rehire',                  requireLogin, requireRole('client'),     ctrl.rehire);

// Milestones
router.post('/contracts/:id/milestones',              requireLogin, requireRole('freelancer'), ctrl.addMilestone);
router.post('/contracts/:id/milestones/:msId/submit', requireLogin, requireRole('freelancer'), ctrl.submitMilestone);
router.post('/contracts/:id/milestones/:msId/review', requireLogin, requireRole('client'),     ctrl.reviewMilestone);
router.post('/contracts/:id/milestones/:msId/delete', requireLogin, requireRole('freelancer'), ctrl.deleteMilestone);

// Change orders
router.post('/contracts/:id/change-orders',             requireLogin, requireRole('freelancer'), ctrl.requestChangeOrder);
router.post('/contracts/:id/change-orders/:coId/review',requireLogin, requireRole('client'),     ctrl.reviewChangeOrder);

module.exports = router;
