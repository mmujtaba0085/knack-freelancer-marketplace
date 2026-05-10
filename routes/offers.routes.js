// routes/offers.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/offers.controller');
const { requireLogin, requireRole } = require('../middleware/auth');

router.get('/freelancers/:freelancerId/offer', requireLogin, requireRole('client'), ctrl.sendOfferForm);
router.post('/offers',                         requireLogin, requireRole('client'), ctrl.sendOffer);

module.exports = router;
