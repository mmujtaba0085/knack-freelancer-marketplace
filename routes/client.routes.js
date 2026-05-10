// routes/client.routes.js
const express   = require('express');
const router    = express.Router();
const dashCtrl  = require('../controllers/dashboard.controller');
const offerCtrl = require('../controllers/offers.controller');
const { requireLogin, requireRole } = require('../middleware/auth');

const guard = [requireLogin, requireRole('client')];

router.get('/',          ...guard, (req, res) => res.redirect('/client/dashboard'));
router.get('/dashboard', ...guard, dashCtrl.clientDashboard);
router.get('/offers',    ...guard, offerCtrl.clientOffers);

module.exports = router;
