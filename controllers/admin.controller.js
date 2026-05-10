// controllers/admin.controller.js
const db = require('../config/db');

exports.dashboard = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role != 'admin') AS total_users,
        (SELECT COUNT(*) FROM users WHERE is_active = 0) AS inactive_users,
        (SELECT COUNT(*) FROM jobs WHERE status = 'open') AS open_jobs,
        (SELECT COUNT(*) FROM contracts WHERE status = 'active') AS active_contracts,
        (SELECT COUNT(*) FROM disputes WHERE status = 'open') AS open_disputes,
        (SELECT COALESCE(SUM(agreed_budget), 0) FROM contracts WHERE status = 'completed') AS total_gmv
    `);
    const [recentUsers] = await db.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    const [disputes] = await db.query(`
      SELECT d.*, u.name AS raised_by_name, j.title AS job_title, c.agreed_budget
      FROM disputes d JOIN users u ON d.raised_by = u.id
      JOIN contracts c ON d.contract_id = c.id JOIN jobs j ON c.job_id = j.id
      WHERE d.status = 'open' ORDER BY d.created_at DESC LIMIT 5
    `);
    // Chart data: new users per month (last 6)
    const [userChart] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%b') AS month, COUNT(*) AS count
      FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY MIN(created_at)
    `);
    res.render('admin/dashboard', { stats, recentUsers, disputes, userChart, user: req.session });
  } catch (e) {
    console.error(e); res.render('shared/error', { message: 'Admin dashboard error.' });
  }
};

exports.users = async (req, res) => {
  const { q = '', role = '' } = req.query;
  let sql = `SELECT u.*, COALESCE(AVG(r.rating),0) AS avg_rating, COUNT(DISTINCT r.id) AS review_count
    FROM users u LEFT JOIN reviews r ON r.reviewee_id = u.id WHERE u.role != 'admin'`;
  const params = [];
  if (q) { sql += ' AND (u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (role) { sql += ' AND u.role = ?'; params.push(role); }
  sql += ' GROUP BY u.id ORDER BY u.created_at DESC';
  const [users] = await db.query(sql, params);
  res.render('admin/users', { users, q, role, user: req.session });
};

exports.toggleActive = async (req, res) => {
  const [rows] = await db.query('SELECT is_active FROM users WHERE id=?', [req.params.id]);
  if (!rows.length) return res.redirect('/admin/users');
  await db.query('UPDATE users SET is_active = ? WHERE id = ?', [rows[0].is_active ? 0 : 1, req.params.id]);
  req.flash('success', `User ${rows[0].is_active ? 'deactivated' : 'activated'}.`);
  res.redirect('/admin/users');
};

exports.changeRole = async (req, res) => {
  const { role } = req.body;
  if (!['client', 'freelancer', 'admin'].includes(role)) return res.redirect('/admin/users');
  await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  req.flash('success', 'Role updated.');
  res.redirect('/admin/users');
};

exports.disputes = async (req, res) => {
  const [disputes] = await db.query(`
    SELECT d.*, u.name AS raised_by_name, c.agreed_budget,
      j.title AS job_title, fl.name AS freelancer_name, cl.name AS client_name
    FROM disputes d
    JOIN users u ON d.raised_by = u.id
    JOIN contracts c ON d.contract_id = c.id
    JOIN jobs j ON c.job_id = j.id
    JOIN users fl ON c.freelancer_id = fl.id
    JOIN users cl ON c.client_id = cl.id
    ORDER BY d.created_at DESC
  `);
  res.render('admin/disputes', { disputes, user: req.session });
};

exports.resolveDispute = async (req, res) => {
  const { admin_note, status } = req.body;
  await db.query('UPDATE disputes SET status=?, admin_note=? WHERE id=?', [status || 'resolved', admin_note, req.params.id]);
  req.flash('success', 'Dispute updated.');
  res.redirect('/admin/disputes');
};

exports.reports = async (req, res) => {
  const [monthlyGmv] = await db.query(`
    SELECT DATE_FORMAT(created_at, '%b %Y') AS month, COALESCE(SUM(agreed_budget),0) AS gmv, COUNT(*) AS contracts
    FROM contracts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month ORDER BY MIN(created_at)
  `);
  const [categoryStats] = await db.query(`
    SELECT cat.name, COUNT(j.id) AS job_count
    FROM categories cat LEFT JOIN jobs j ON j.category_id = cat.id
    GROUP BY cat.id ORDER BY job_count DESC
  `);
  res.render('admin/reports', { monthlyGmv, categoryStats, user: req.session });
};
