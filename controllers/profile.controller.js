// controllers/profile.controller.js
const db = require('../config/db');

exports.view = async (req, res) => {
  const uid = req.params.id || req.session.userId;
  const [rows] = await db.query('SELECT * FROM users WHERE id=? AND is_active=1', [uid]);
  if (!rows.length) return res.render('shared/404', { user: req.session });

  const user = rows[0];
  const [reviews] = await db.query(`
    SELECT r.*, u.name AS reviewer_name FROM reviews r JOIN users u ON r.reviewer_id=u.id
    WHERE r.reviewee_id=? ORDER BY r.created_at DESC LIMIT 10
  `, [uid]);
  const [[ratingStats]] = await db.query(
    'SELECT COALESCE(AVG(rating),0) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE reviewee_id=?', [uid]
  );
  const [skills] = await db.query(
    'SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id=s.id WHERE us.user_id=?', [uid]
  );
  const [completedJobs] = await db.query(
    'SELECT COUNT(*) AS count FROM contracts WHERE freelancer_id=? AND status="completed"', [uid]
  );
  const [portfolio] = await db.query(
    'SELECT * FROM portfolio_items WHERE freelancer_id=? ORDER BY display_order ASC, created_at DESC', [uid]
  );

  res.render('shared/profile', { profile: user, reviews, ratingStats, skills, portfolio, completedJobs: completedJobs[0].count, user: req.session });
};

exports.editProfile = async (req, res) => {
  const uid = req.session.userId;
  const [rows] = await db.query('SELECT * FROM users WHERE id=?', [uid]);
  const [skills] = await db.query('SELECT s.id, s.name FROM user_skills us JOIN skills s ON us.skill_id=s.id WHERE us.user_id=?', [uid]);
  const [allSkills] = await db.query('SELECT * FROM skills ORDER BY name');
  const [portfolio] = await db.query('SELECT * FROM portfolio_items WHERE freelancer_id=? ORDER BY display_order ASC', [uid]);
  res.render('shared/edit-profile', { profile: rows[0], mySkills: skills, allSkills, portfolio, errors: [], user: req.session });
};

exports.saveProfile = async (req, res) => {
  const uid = req.session.userId;
  const { name, headline, bio, location, hourly_rate, availability } = req.body;
  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  const fields = { name, headline, bio, location, availability };
  if (hourly_rate) fields.hourly_rate = parseFloat(hourly_rate);
  if (avatarUrl)   fields.avatar_url = avatarUrl;

  const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
  await db.query(`UPDATE users SET ${sets} WHERE id=?`, [...Object.values(fields), uid]);

  // Always re-sync skills for freelancers (allows clearing all skills)
  if (req.session.role === 'freelancer') {
    await db.query('DELETE FROM user_skills WHERE user_id=?', [uid]);
    if (req.body.skills) {
      const skillIds = Array.isArray(req.body.skills) ? req.body.skills : [req.body.skills];
      for (const sid of skillIds) {
        await db.query('INSERT IGNORE INTO user_skills (user_id, skill_id) VALUES (?,?)', [uid, sid]);
      }
    }
  }

  req.session.userName = name;
  if (avatarUrl) req.session.avatarUrl = avatarUrl;
  req.flash('success', 'Profile updated.');
  res.redirect(`/profile`);
};

// ─── Portfolio ─────────────────────────────────────────────────────────────────
exports.addPortfolioItem = async (req, res) => {
  const uid = req.session.userId;
  if (req.session.role !== 'freelancer') return res.redirect('/profile');
  const { title, description, external_url } = req.body;
  if (!title) { req.flash('error', 'Portfolio item title is required.'); return res.redirect('/profile'); }
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const [ord] = await db.query('SELECT COALESCE(MAX(display_order),0)+1 AS next FROM portfolio_items WHERE freelancer_id=?', [uid]);
  const count = (await db.query('SELECT COUNT(*) AS c FROM portfolio_items WHERE freelancer_id=?', [uid]))[0][0].c;
  if (count >= 8) { req.flash('error', 'Maximum 8 portfolio items allowed.'); return res.redirect('/profile'); }
  await db.query(
    'INSERT INTO portfolio_items (freelancer_id, title, description, image_url, external_url, display_order) VALUES (?,?,?,?,?,?)',
    [uid, title, description || null, imageUrl, external_url || null, ord[0].next]
  );
  req.flash('success', 'Portfolio item added.');
  res.redirect('/profile');
};

exports.deletePortfolioItem = async (req, res) => {
  const uid = req.session.userId;
  await db.query('DELETE FROM portfolio_items WHERE id=? AND freelancer_id=?', [req.params.id, uid]);
  req.flash('success', 'Portfolio item removed.');
  res.redirect('/profile');
};
