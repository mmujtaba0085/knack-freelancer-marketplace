// controllers/offers.controller.js
const db = require('../config/db');
const { createNotification } = require('../models/notification.model');

// ─── GET /freelancers/:freelancerId/offer ─────────────────────────────────────
exports.sendOfferForm = async (req, res) => {
  if (req.session.role !== 'client') return res.redirect('/');
  const [fl] = await db.query(
    'SELECT id, name, headline, avatar_url FROM users WHERE id=? AND role="freelancer" AND is_active=1',
    [req.params.freelancerId]
  );
  if (!fl.length) return res.redirect('/');
  res.render('client/send-offer', { freelancer: fl[0], errors: [], body: {}, user: req.session });
};

// ─── POST /offers ─────────────────────────────────────────────────────────────
exports.sendOffer = async (req, res) => {
  const uid = req.session.userId;
  const { freelancer_id, title, description, budget, deadline } = req.body;
  if (!title || !description || !budget) {
    const [fl] = await db.query('SELECT id, name, headline FROM users WHERE id=?', [freelancer_id]);
    return res.render('client/send-offer', {
      freelancer: fl[0] || {}, errors: [{ msg: 'Title, description and budget are required.' }],
      body: req.body, user: req.session
    });
  }
  await db.query(
    'INSERT INTO offers (client_id, freelancer_id, title, description, budget, deadline) VALUES (?,?,?,?,?,?)',
    [uid, freelancer_id, title, description, parseFloat(budget), deadline || null]
  );
  await createNotification(freelancer_id, 'system',
    `${req.session.userName} sent you a direct offer: "${title}"`, '/freelancer/offers');
  req.flash('success', 'Offer sent successfully!');
  res.redirect(`/profile/${freelancer_id}`);
};

// ─── GET /client/offers ───────────────────────────────────────────────────────
exports.clientOffers = async (req, res) => {
  const uid = req.session.userId;
  const [offers] = await db.query(`
    SELECT o.*, u.name AS freelancer_name, u.avatar_url AS freelancer_avatar, u.headline AS freelancer_headline
    FROM offers o JOIN users u ON o.freelancer_id=u.id
    WHERE o.client_id=? ORDER BY o.created_at DESC
  `, [uid]);
  res.render('client/offers', { offers, user: req.session });
};

// ─── GET /freelancer/offers ───────────────────────────────────────────────────
exports.freelancerOffers = async (req, res) => {
  const uid = req.session.userId;
  const [offers] = await db.query(`
    SELECT o.*, u.name AS client_name, u.avatar_url AS client_avatar, u.headline AS client_headline
    FROM offers o JOIN users u ON o.client_id=u.id
    WHERE o.freelancer_id=? ORDER BY o.created_at DESC
  `, [uid]);
  res.render('freelancer/offers', { offers, user: req.session });
};

// ─── POST /freelancer/offers/:id/respond ─────────────────────────────────────
exports.respondOffer = async (req, res) => {
  const uid = req.session.userId;
  const [rows] = await db.query(
    'SELECT * FROM offers WHERE id=? AND freelancer_id=? AND status="pending"',
    [req.params.id, uid]
  );
  if (!rows.length) return res.redirect('/freelancer/offers');
  const offer = rows[0];
  const status = req.body.action === 'accept' ? 'accepted' : 'declined';
  await db.query('UPDATE offers SET status=? WHERE id=?', [status, req.params.id]);

  if (status === 'accepted') {
    const [jobR] = await db.query(
      'INSERT INTO jobs (client_id, title, description, budget_min, budget_max, deadline, status) VALUES (?,?,?,?,?,?,"in_progress")',
      [offer.client_id, offer.title, offer.description, offer.budget, offer.budget, offer.deadline || null]
    );
    const [propR] = await db.query(
      'INSERT INTO proposals (job_id, freelancer_id, cover_letter, proposed_budget, estimated_days, status) VALUES (?,?,"Direct offer accepted.",?,30,"accepted")',
      [jobR.insertId, uid, offer.budget]
    );
    await db.query(
      'INSERT INTO contracts (job_id, proposal_id, client_id, freelancer_id, agreed_budget, deadline) VALUES (?,?,?,?,?,?)',
      [jobR.insertId, propR.insertId, offer.client_id, uid, offer.budget, offer.deadline || null]
    );
    await createNotification(offer.client_id, 'accepted',
      `${req.session.userName} accepted your offer: "${offer.title}". Contract created!`, '/client/contracts');
    req.flash('success', 'Offer accepted! Contract created.');
  } else {
    await createNotification(offer.client_id, 'system',
      `${req.session.userName} declined your offer: "${offer.title}".`, '/client/offers');
    req.flash('success', 'Offer declined.');
  }
  res.redirect('/freelancer/offers');
};
