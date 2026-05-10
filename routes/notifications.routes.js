// routes/notifications.routes.js
const express = require('express');
const router  = express.Router();
const { requireLogin } = require('../middleware/auth');
const notifModel = require('../models/notification.model');

router.get('/notifications/unread-count', requireLogin, async (req, res) => {
  const count = await notifModel.getUnreadCount(req.session.userId);
  res.json({ count });
});

router.get('/notifications', requireLogin, async (req, res) => {
  const notifs = await notifModel.getUserNotifications(req.session.userId, 30);
  await notifModel.markAllRead(req.session.userId);
  res.render('shared/notifications', { notifs, user: req.session });
});

router.post('/notifications/mark-read', requireLogin, async (req, res) => {
  await notifModel.markAllRead(req.session.userId);
  res.json({ ok: true });
});

module.exports = router;
