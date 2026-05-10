// models/notification.model.js
const db = require('../config/db');

exports.createNotification = async (userId, type, message, link = null) => {
  try {
    await db.query('INSERT INTO notifications (user_id, type, message, link) VALUES (?,?,?,?)', [userId, type, message, link]);
  } catch (e) { console.error('Notification error:', e); }
};

exports.getUserNotifications = async (userId, limit = 20) => {
  const [rows] = await db.query(
    'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  return rows;
};

exports.getUnreadCount = async (userId) => {
  const [[row]] = await db.query('SELECT COUNT(*) AS count FROM notifications WHERE user_id=? AND is_read=0', [userId]);
  return row.count;
};

exports.markAllRead = async (userId) => {
  await db.query('UPDATE notifications SET is_read=1 WHERE user_id=?', [userId]);
};
