// controllers/proposals.controller.js
const db = require('../config/db');
const { createNotification } = require('../models/notification.model');

// ─── Submit proposal ──────────────────────────────────────────────────────────
exports.submit = async (req, res) => {
  if (req.validationErrors) {
    const [jobRows] = await db.query('SELECT j.*, u.name AS client_name FROM jobs j JOIN users u ON j.client_id = u.id WHERE j.id = ?', [req.params.jobId]);
    return res.render('freelancer/apply', { job: jobRows[0], errors: req.validationErrors, body: req.body, user: req.session });
  }
  try {
    const jobId = req.params.jobId;
    const [existing] = await db.query('SELECT id FROM proposals WHERE job_id=? AND freelancer_id=?', [jobId, req.session.userId]);
    if (existing.length) {
      req.flash('error', 'You have already applied for this job.');
      return res.redirect(`/jobs/${jobId}`);
    }
    const [jobRows] = await db.query('SELECT client_id, title FROM jobs WHERE id=? AND status="open"', [jobId]);
    if (!jobRows.length) return res.redirect('/freelancer/browse');

    await db.query(
      'INSERT INTO proposals (job_id, freelancer_id, cover_letter, proposed_budget, estimated_days) VALUES (?,?,?,?,?)',
      [jobId, req.session.userId, req.body.cover_letter, req.body.proposed_budget, req.body.estimated_days]
    );
    // Notify client
    await createNotification(
      jobRows[0].client_id,
      'proposal',
      `${req.session.userName} submitted a proposal for "${jobRows[0].title}"`,
      `/client/proposals/${jobId}`
    );
    req.flash('success', 'Proposal submitted! The client will be in touch.');
    res.redirect('/freelancer/applications');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Could not submit proposal.');
    res.redirect('/freelancer/browse');
  }
};

// ─── Client: view proposals for a job ────────────────────────────────────────
exports.viewForJob = async (req, res) => {
  try {
    const [jobRows] = await db.query('SELECT * FROM jobs WHERE id=? AND client_id=?', [req.params.jobId, req.session.userId]);
    if (!jobRows.length) return res.redirect('/client/jobs');

    const [proposals] = await db.query(`
      SELECT p.*, u.name AS freelancer_name, u.headline, u.avatar_url, u.location, u.hourly_rate,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(DISTINCT r.id) AS review_count
      FROM proposals p
      JOIN users u ON p.freelancer_id = u.id
      LEFT JOIN reviews r ON r.reviewee_id = u.id
      WHERE p.job_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [req.params.jobId]);

    res.render('client/proposals', { job: jobRows[0], proposals, user: req.session });
  } catch (e) {
    console.error(e); res.redirect('/client/jobs');
  }
};

// ─── Accept proposal ──────────────────────────────────────────────────────────
exports.accept = async (req, res) => {
  try {
    const [propRows] = await db.query(
      'SELECT p.*, j.client_id, j.title FROM proposals p JOIN jobs j ON p.job_id = j.id WHERE p.id = ? AND j.client_id = ?',
      [req.params.id, req.session.userId]
    );
    if (!propRows.length) return res.redirect('/client/jobs');
    const prop = propRows[0];

    await db.query('UPDATE proposals SET status="accepted" WHERE id=?', [prop.id]);
    await db.query('UPDATE jobs SET status="in_progress" WHERE id=?', [prop.job_id]);
    // Reject all other proposals
    await db.query('UPDATE proposals SET status="rejected" WHERE job_id=? AND id!=?', [prop.job_id, prop.id]);
    // Create contract
    const [contractResult] = await db.query(
      'INSERT INTO contracts (job_id, proposal_id, client_id, freelancer_id, agreed_budget) VALUES (?,?,?,?,?)',
      [prop.job_id, prop.id, prop.client_id, prop.freelancer_id, prop.proposed_budget]
    );
    // Notify freelancer
    await createNotification(prop.freelancer_id, 'accepted',
      `Your proposal for "${prop.title}" was accepted! Contract created.`,
      `/contracts/${contractResult.insertId}`
    );
    req.flash('success', 'Proposal accepted and contract created.');
    res.redirect(`/client/contracts`);
  } catch (e) {
    console.error(e);
    req.flash('error', 'Could not accept proposal.');
    res.redirect('/client/jobs');
  }
};

// ─── Reject proposal ──────────────────────────────────────────────────────────
exports.reject = async (req, res) => {
  const [propRows] = await db.query(
    'SELECT p.*, j.client_id, j.title FROM proposals p JOIN jobs j ON p.job_id = j.id WHERE p.id = ? AND j.client_id = ?',
    [req.params.id, req.session.userId]
  );
  if (!propRows.length) return res.redirect('/client/jobs');
  await db.query('UPDATE proposals SET status="rejected" WHERE id=?', [req.params.id]);
  await createNotification(propRows[0].freelancer_id, 'rejected',
    `Your proposal for "${propRows[0].title}" was not selected this time.`,
    '/freelancer/applications'
  );
  req.flash('success', 'Proposal rejected.');
  res.redirect(`/client/proposals/${propRows[0].job_id}`);
};

// ─── Freelancer: my applications ─────────────────────────────────────────────
exports.myApplications = async (req, res) => {
  const [proposals] = await db.query(`
    SELECT p.*, j.title AS job_title, j.budget_min, j.budget_max, u.name AS client_name
    FROM proposals p JOIN jobs j ON p.job_id = j.id JOIN users u ON j.client_id = u.id
    WHERE p.freelancer_id = ? ORDER BY p.created_at DESC
  `, [req.session.userId]);
  res.render('freelancer/applications', { proposals, user: req.session });
};
