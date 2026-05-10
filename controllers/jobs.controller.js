// controllers/jobs.controller.js
const db = require('../config/db');
const { createNotification } = require('../models/notification.model');

// ─── Browse jobs (freelancer) ─────────────────────────────────────────────────
exports.browse = async (req, res) => {
  try {
    const { q = '', category = '', level = '', budget_min = '', budget_max = '' } = req.query;
    const userId = req.session.userId;

    let sql = `
      SELECT j.*, u.name AS client_name, c.name AS category_name, c.icon AS category_icon,
        (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id) AS proposal_count,
        COALESCE((
          SELECT COUNT(*) FROM user_skills us
          JOIN skills sk ON us.skill_id = sk.id
          WHERE us.user_id = ? AND FIND_IN_SET(sk.name, j.skills_text)
        ), 0) AS skill_overlap
      FROM jobs j
      JOIN users u ON j.client_id = u.id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.status = 'open'
    `;
    const params = [userId];

    if (q) { sql += ' AND (j.title LIKE ? OR j.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (category) { sql += ' AND c.slug = ?'; params.push(category); }
    if (level) { sql += ' AND j.level = ?'; params.push(level); }
    if (budget_min) { sql += ' AND j.budget_max >= ?'; params.push(parseFloat(budget_min)); }
    if (budget_max) { sql += ' AND j.budget_min <= ?'; params.push(parseFloat(budget_max)); }

    sql += ' ORDER BY skill_overlap DESC, j.created_at DESC LIMIT 60';

    const [jobs] = await db.query(sql, params);
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name');

    // Fetch saved job IDs for this freelancer
    const [saved] = await db.query('SELECT job_id FROM saved_jobs WHERE freelancer_id=?', [userId]);
    const savedSet = new Set(saved.map(s => s.job_id));

    jobs.forEach(j => {
      const skillCount = j.skills_text ? j.skills_text.split(',').length : 1;
      j.match_score = Math.min(99, Math.round((j.skill_overlap / Math.max(skillCount, 1)) * 60 + 20 + Math.random() * 15));
      j.is_saved = savedSet.has(j.id);
    });

    res.render('freelancer/browse', { jobs, categories, q, category, level, budget_min, budget_max, user: req.session });
  } catch (e) {
    console.error(e); res.render('shared/error', { message: 'Could not load jobs.' });
  }
};

// ─── Job detail ───────────────────────────────────────────────────────────────
exports.detail = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT j.*, u.name AS client_name, u.avatar_url AS client_avatar, c.name AS category_name,
        (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id) AS proposal_count
      FROM jobs j JOIN users u ON j.client_id = u.id LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.id = ?
    `, [req.params.id]);
    if (!rows.length) return res.redirect('/freelancer/browse');

    // Check if already applied
    const [applied] = await db.query(
      'SELECT id, status FROM proposals WHERE job_id = ? AND freelancer_id = ?',
      [req.params.id, req.session.userId]
    );
    res.render('freelancer/job-detail', { job: rows[0], applied: applied[0] || null, user: req.session });
  } catch (e) {
    console.error(e); res.redirect('/freelancer/browse');
  }
};

// ─── Post job (client) ────────────────────────────────────────────────────────
exports.getPostJob = async (req, res) => {
  const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
  res.render('client/post-job', { errors: [], body: {}, categories, user: req.session });
};

exports.postJob = async (req, res) => {
  if (req.validationErrors) {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
    return res.render('client/post-job', { errors: req.validationErrors, body: req.body, categories, user: req.session });
  }
  try {
    const { title, description, budget_min, budget_max, deadline, level, category_id, skills_text } = req.body;
    await db.query(
      'INSERT INTO jobs (client_id, category_id, title, description, budget_min, budget_max, deadline, level, skills_text) VALUES (?,?,?,?,?,?,?,?,?)',
      [req.session.userId, category_id || null, title, description, budget_min, budget_max, deadline || null, level, skills_text || '']
    );
    req.flash('success', 'Job posted successfully!');
    res.redirect('/client/jobs');
  } catch (e) {
    console.error(e);
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
    res.render('client/post-job', { errors: [{ msg: 'Failed to post job.' }], body: req.body, categories, user: req.session });
  }
};

// ─── Client's jobs list ───────────────────────────────────────────────────────
exports.clientJobs = async (req, res) => {
  try {
    const [jobs] = await db.query(`
      SELECT j.*, c.name AS category_name,
        (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id) AS proposal_count,
        (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id AND p.status = 'pending') AS new_proposals
      FROM jobs j LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.client_id = ? ORDER BY j.created_at DESC
    `, [req.session.userId]);
    res.render('client/jobs', { jobs, user: req.session });
  } catch (e) {
    console.error(e); res.render('shared/error', { message: 'Could not load jobs.' });
  }
};

// ─── Edit job ─────────────────────────────────────────────────────────────────
exports.getEditJob = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM jobs WHERE id = ? AND client_id = ?', [req.params.id, req.session.userId]);
  if (!rows.length) return res.redirect('/client/jobs');
  const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
  res.render('client/edit-job', { job: rows[0], errors: [], categories, user: req.session });
};

exports.postEditJob = async (req, res) => {
  const [rows] = await db.query('SELECT id FROM jobs WHERE id = ? AND client_id = ?', [req.params.id, req.session.userId]);
  if (!rows.length) return res.redirect('/client/jobs');
  if (req.validationErrors) {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
    return res.render('client/edit-job', { job: { ...req.body, id: req.params.id }, errors: req.validationErrors, categories, user: req.session });
  }
  const { title, description, budget_min, budget_max, deadline, level, category_id, skills_text } = req.body;
  await db.query(
    'UPDATE jobs SET title=?, description=?, budget_min=?, budget_max=?, deadline=?, level=?, category_id=?, skills_text=? WHERE id=?',
    [title, description, budget_min, budget_max, deadline || null, level, category_id || null, skills_text || '', req.params.id]
  );
  req.flash('success', 'Job updated.');
  res.redirect('/client/jobs');
};

exports.deleteJob = async (req, res) => {
  const [jobRows] = await db.query('SELECT title FROM jobs WHERE id=? AND client_id=?', [req.params.id, req.session.userId]);
  if (!jobRows.length) return res.redirect('/client/jobs');

  await db.query('UPDATE jobs SET status="cancelled" WHERE id=?', [req.params.id]);

  // Notify all pending applicants
  const [applicants] = await db.query(
    'SELECT freelancer_id FROM proposals WHERE job_id=? AND status="pending"',
    [req.params.id]
  );
  await Promise.all(applicants.map(a =>
    createNotification(a.freelancer_id, 'system',
      `The job "${jobRows[0].title}" you applied for has been cancelled.`,
      '/freelancer/applications'
    )
  ));

  req.flash('success', 'Job cancelled.');
  res.redirect('/client/jobs');
};

// ─── Save / unsave job (toggle) ───────────────────────────────────────────────
exports.toggleSave = async (req, res) => {
  const uid = req.session.userId;
  const jid = req.params.id;
  const [existing] = await db.query('SELECT 1 FROM saved_jobs WHERE freelancer_id=? AND job_id=?', [uid, jid]);
  if (existing.length) {
    await db.query('DELETE FROM saved_jobs WHERE freelancer_id=? AND job_id=?', [uid, jid]);
  } else {
    await db.query('INSERT IGNORE INTO saved_jobs (freelancer_id, job_id) VALUES (?,?)', [uid, jid]);
  }
  // Respond with JSON for AJAX or redirect if form POST
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({ saved: !existing.length });
  }
  res.redirect('back');
};

// ─── Saved jobs page ──────────────────────────────────────────────────────────
exports.savedJobs = async (req, res) => {
  const uid = req.session.userId;
  const [jobs] = await db.query(`
    SELECT j.*, u.name AS client_name, c.name AS category_name, c.icon AS category_icon,
      (SELECT COUNT(*) FROM proposals p WHERE p.job_id=j.id) AS proposal_count
    FROM saved_jobs sj
    JOIN jobs j ON sj.job_id=j.id
    JOIN users u ON j.client_id=u.id
    LEFT JOIN categories c ON j.category_id=c.id
    WHERE sj.freelancer_id=?
    ORDER BY sj.created_at DESC
  `, [uid]);
  res.render('freelancer/saved-jobs', { jobs, user: req.session });
};

// ─── API search (JSON) ────────────────────────────────────────────────────────
exports.apiSearch = async (req, res) => {
  try {
    const { q = '', category = '', level = '' } = req.query;
    let sql = `SELECT j.id, j.title, j.budget_min, j.budget_max, j.level, j.created_at,
      u.name AS client_name, c.name AS category_name
      FROM jobs j JOIN users u ON j.client_id = u.id LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.status = 'open'`;
    const params = [];
    if (q) { sql += ' AND (j.title LIKE ? OR j.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (category) { sql += ' AND c.slug = ?'; params.push(category); }
    if (level) { sql += ' AND j.level = ?'; params.push(level); }
    sql += ' ORDER BY j.created_at DESC LIMIT 20';
    const [jobs] = await db.query(sql, params);
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ error: 'Search failed' });
  }
};
