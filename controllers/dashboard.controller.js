// controllers/dashboard.controller.js
const db = require('../config/db');

// ─── Client Dashboard ─────────────────────────────────────────────────────────
exports.clientDashboard = async (req, res) => {
  try {
    const uid = req.session.userId;
    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM jobs WHERE client_id=? AND status='open') AS open_jobs,
        (SELECT COUNT(*) FROM jobs WHERE client_id=? AND status='in_progress') AS active_contracts,
        (SELECT COUNT(*) FROM jobs WHERE client_id=? AND status='completed') AS completed_jobs,
        (SELECT COUNT(*) FROM proposals p JOIN jobs j ON p.job_id=j.id WHERE j.client_id=? AND p.status='pending') AS new_proposals,
        (SELECT COALESCE(SUM(agreed_budget),0) FROM contracts WHERE client_id=? AND status='completed') AS total_spent
    `, [uid, uid, uid, uid, uid]);

    const [recentJobs] = await db.query(`
      SELECT j.*, c.name AS category_name,
        (SELECT COUNT(*) FROM proposals p WHERE p.job_id=j.id AND p.status='pending') AS new_proposals
      FROM jobs j LEFT JOIN categories c ON j.category_id=c.id
      WHERE j.client_id=? ORDER BY j.created_at DESC LIMIT 5
    `, [uid]);

    const [activeContracts] = await db.query(`
      SELECT ct.*, j.title AS job_title, u.name AS freelancer_name
      FROM contracts ct JOIN jobs j ON ct.job_id=j.id JOIN users u ON ct.freelancer_id=u.id
      WHERE ct.client_id=? AND ct.status='active' ORDER BY ct.created_at DESC LIMIT 5
    `, [uid]);

    // Spend per month (last 6 months)
    const [spendChart] = await db.query(`
      SELECT DATE_FORMAT(created_at,'%b') AS month, COALESCE(SUM(agreed_budget),0) AS spend
      FROM contracts WHERE client_id=? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY MIN(created_at)
    `, [uid]);

    res.render('client/dashboard', { stats, recentJobs, activeContracts, spendChart, user: req.session });
  } catch (e) {
    console.error(e); res.render('shared/error', { message: 'Dashboard error.' });
  }
};

// ─── Freelancer Dashboard ─────────────────────────────────────────────────────
exports.freelancerDashboard = async (req, res) => {
  try {
    const uid = req.session.userId;
    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM contracts WHERE freelancer_id=? AND status='active') AS active_contracts,
        (SELECT COUNT(*) FROM contracts WHERE freelancer_id=? AND status='completed') AS completed_contracts,
        (SELECT COUNT(*) FROM proposals WHERE freelancer_id=? AND status='pending') AS pending_proposals,
        (SELECT COALESCE(SUM(agreed_budget),0) FROM contracts WHERE freelancer_id=? AND status='completed') AS total_earned,
        (SELECT COALESCE(SUM(agreed_budget),0) FROM contracts WHERE freelancer_id=? AND status='active') AS in_escrow,
        (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE reviewee_id=?) AS avg_rating
    `, [uid, uid, uid, uid, uid, uid]);

    const [activeContracts] = await db.query(`
      SELECT ct.*, j.title AS job_title, u.name AS client_name
      FROM contracts ct JOIN jobs j ON ct.job_id=j.id JOIN users u ON ct.client_id=u.id
      WHERE ct.freelancer_id=? AND ct.status='active' ORDER BY ct.created_at DESC LIMIT 5
    `, [uid]);

    // Job matches
    const [matchedJobs] = await db.query(`
      SELECT j.*, u.name AS client_name, c.name AS category_name,
        COALESCE((
          SELECT COUNT(*) FROM user_skills us JOIN skills sk ON us.skill_id=sk.id
          WHERE us.user_id=? AND FIND_IN_SET(sk.name, j.skills_text)
        ),0) AS skill_overlap
      FROM jobs j JOIN users u ON j.client_id=u.id LEFT JOIN categories c ON j.category_id=c.id
      WHERE j.status='open'
      ORDER BY skill_overlap DESC, j.created_at DESC LIMIT 4
    `, [uid]);

    matchedJobs.forEach(j => {
      const skillCount = j.skills_text ? j.skills_text.split(',').length : 1;
      j.match_score = Math.min(99, Math.round((j.skill_overlap / Math.max(skillCount,1)) * 60 + 25));
    });

    // Earnings chart
    const [earningsChart] = await db.query(`
      SELECT DATE_FORMAT(created_at,'%b') AS month, COALESCE(SUM(agreed_budget),0) AS earned
      FROM contracts WHERE freelancer_id=? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY MIN(created_at)
    `, [uid]);

    res.render('freelancer/dashboard', { stats, activeContracts, matchedJobs, earningsChart, user: req.session });
  } catch (e) {
    console.error(e); res.render('shared/error', { message: 'Dashboard error.' });
  }
};
