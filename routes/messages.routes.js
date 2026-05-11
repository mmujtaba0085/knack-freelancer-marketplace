// routes/messages.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/messages.controller');
const { requireLogin } = require('../middleware/auth');

router.get('/messages',                    requireLogin, ctrl.inbox);
router.get('/proposals/:id/chat',          requireLogin, ctrl.proposalChat);
router.get('/contracts/:id/chat',          requireLogin, ctrl.contractChat);
router.post('/messages/send',              requireLogin, ctrl.chatUpload.single('file'), ctrl.send);
router.get('/api/contracts/:id/messages',  requireLogin, ctrl.poll);
router.get('/api/proposals/:id/messages',  requireLogin, ctrl.pollProposal);

module.exports = router;
