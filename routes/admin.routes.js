// routes/admin.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/admin.controller');
const { requireLogin, requireRole } = require('../middleware/auth');

const guard = [requireLogin, requireRole('admin')];

router.get('/',                         ...guard, ctrl.dashboard);
router.get('/users',                    ...guard, ctrl.users);
router.post('/users/:id/toggle-active', ...guard, ctrl.toggleActive);
router.post('/users/:id/role',          ...guard, ctrl.changeRole);
router.get('/disputes',                 ...guard, ctrl.disputes);
router.post('/disputes/:id/resolve',    ...guard, ctrl.resolveDispute);
router.get('/reports',                  ...guard, ctrl.reports);

module.exports = router;
