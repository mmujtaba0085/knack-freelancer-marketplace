// controllers/contracts.controller.js
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const { createNotification } = require('../models/notification.model');

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, safe);
  }
});
exports.upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Client: view all contracts ───────────────────────────────────────────────
exports.clientContracts = async (req, res) => {
  const [contracts] = await db.query(`
    SELECT ct.*, j.title AS job_title, u.name AS freelancer_name
    FROM contracts ct JOIN jobs j ON ct.job_id=j.id JOIN users u ON ct.freelancer_id=u.id
    WHERE ct.client_id=? ORDER BY ct.created_at DESC
  `, [req.session.userId]);
  res.render('client/contracts', { contracts, user: req.session });
};

// ─── Freelancer: view all contracts ──────────────────────────────────────────
exports.freelancerContracts = async (req, res) => {
  const [contracts] = await db.query(`
    SELECT ct.*, j.title AS job_title, u.name AS client_name
    FROM contracts ct JOIN jobs j ON ct.job_id=j.id JOIN users u ON ct.client_id=u.id
    WHERE ct.freelancer_id=? ORDER BY ct.created_at DESC
  `, [req.session.userId]);
  res.render('freelancer/contracts', { contracts, user: req.session });
};

// ─── Contract detail ──────────────────────────────────────────────────────────
exports.detail = async (req, res) => {
  const uid = req.session.userId;
  const [rows] = await db.query(`
    SELECT ct.*, j.title AS job_title, j.description AS job_desc,
      cl.name AS client_name, fl.name AS freelancer_name
    FROM contracts ct
    JOIN jobs j ON ct.job_id=j.id
    JOIN users cl ON ct.client_id=cl.id
    JOIN users fl ON ct.freelancer_id=fl.id
    WHERE ct.id=? AND (ct.client_id=? OR ct.freelancer_id=?)
  `, [req.params.id, uid, uid]);
  if (!rows.length) return res.redirect('/dashboard');

  const [deliverables] = await db.query('SELECT * FROM deliverables WHERE contract_id=? ORDER BY submitted_at DESC', [req.params.id]);
  const [reviews] = await db.query('SELECT r.*, u.name AS reviewer_name FROM reviews r JOIN users u ON r.reviewer_id=u.id WHERE r.contract_id=?', [req.params.id]);
  const [milestones] = await db.query('SELECT * FROM milestones WHERE contract_id=? ORDER BY display_order ASC, created_at ASC', [req.params.id]);
  const [changeOrders] = await db.query(`
    SELECT co.*, u.name AS requester_name FROM change_orders co JOIN users u ON co.requested_by=u.id
    WHERE co.contract_id=? ORDER BY co.created_at DESC
  `, [req.params.id]);
  const [msgCount] = await db.query('SELECT COUNT(*) AS c FROM messages WHERE contract_id=?', [req.params.id]);

  const contract = rows[0];
  const isClient = contract.client_id === uid;

  // Derive progress from milestones if any exist
  if (milestones.length > 0) {
    const approved = milestones.filter(m => m.status === 'approved').length;
    contract.milestone_pct = Math.round((approved / milestones.length) * 100);
  }

  res.render('shared/contract-detail', { contract, deliverables, reviews, milestones, changeOrders, msgCount: msgCount[0].c, isClient, user: req.session });
};

// ─── Update milestone ─────────────────────────────────────────────────────────
exports.updateMilestone = async (req, res) => {
  const pct = Math.min(100, Math.max(0, parseInt(req.body.milestone_pct) || 0));
  const [rows] = await db.query('SELECT * FROM contracts WHERE id=?', [req.params.id]);
  if (!rows.length) return res.redirect('/dashboard');
  const ct = rows[0];
  if (ct.client_id !== req.session.userId && ct.freelancer_id !== req.session.userId) return res.redirect('/dashboard');

  await db.query('UPDATE contracts SET milestone_pct=? WHERE id=?', [pct, req.params.id]);

  if (pct === 100 && req.body.complete) {
    await db.query('UPDATE contracts SET status="completed" WHERE id=?', [req.params.id]);
    await db.query('UPDATE jobs SET status="completed" WHERE id=?', [ct.job_id]);
    const notifyId = ct.client_id === req.session.userId ? ct.freelancer_id : ct.client_id;
    await createNotification(notifyId, 'contract', 'A contract has been marked as completed.', `/contracts/${req.params.id}`);
  }
  req.flash('success', 'Milestone updated.');
  res.redirect(`/contracts/${req.params.id}`);
};

// ─── Submit deliverable ───────────────────────────────────────────────────────
exports.submitDeliverable = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM contracts WHERE id=? AND freelancer_id=?', [req.params.id, req.session.userId]);
  if (!rows.length) return res.redirect('/freelancer/contracts');

  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  await db.query('INSERT INTO deliverables (contract_id, file_url, message) VALUES (?,?,?)',
    [req.params.id, fileUrl, req.body.message || '']);
  await createNotification(rows[0].client_id, 'contract', `${req.session.userName} submitted a deliverable.`, `/contracts/${req.params.id}`);
  req.flash('success', 'Deliverable submitted.');
  res.redirect(`/contracts/${req.params.id}`);
};

// ─── Approve / request revision ───────────────────────────────────────────────
exports.reviewDeliverable = async (req, res) => {
  const { deliverable_id, action } = req.body;
  const status = action === 'approve' ? 'approved' : 'revision';
  const [delRows] = await db.query('SELECT d.*, ct.client_id, ct.freelancer_id FROM deliverables d JOIN contracts ct ON d.contract_id=ct.id WHERE d.id=?', [deliverable_id]);
  if (!delRows.length || delRows[0].client_id !== req.session.userId) return res.redirect('/client/contracts');

  await db.query('UPDATE deliverables SET status=? WHERE id=?', [status, deliverable_id]);
  await createNotification(delRows[0].freelancer_id, 'contract',
    `Your deliverable was ${status === 'approved' ? 'approved ✓' : 'sent back for revision'}.`,
    `/contracts/${delRows[0].contract_id}`
  );
  req.flash('success', `Deliverable ${status}.`);
  res.redirect(`/contracts/${delRows[0].contract_id}`);
};

// ─── Submit review ────────────────────────────────────────────────────────────
exports.submitReview = async (req, res) => {
  const uid = req.session.userId;
  const [ctRows] = await db.query('SELECT * FROM contracts WHERE id=? AND (client_id=? OR freelancer_id=?)', [req.params.id, uid, uid]);
  if (!ctRows.length) return res.redirect('/dashboard');
  const ct = ctRows[0];
  const revieweeId = ct.client_id === uid ? ct.freelancer_id : ct.client_id;

  const [existing] = await db.query('SELECT id FROM reviews WHERE contract_id=? AND reviewer_id=?', [req.params.id, uid]);
  if (existing.length) { req.flash('error', 'You already reviewed this contract.'); return res.redirect(`/contracts/${req.params.id}`); }

  if (req.validationErrors) { req.flash('error', req.validationErrors[0].msg); return res.redirect(`/contracts/${req.params.id}`); }

  await db.query('INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment) VALUES (?,?,?,?,?)',
    [req.params.id, uid, revieweeId, req.body.rating, req.body.comment]);
  await createNotification(revieweeId, 'review', `${req.session.userName} left you a ${req.body.rating}-star review.`, `/profile/${revieweeId}`);
  req.flash('success', 'Review submitted.');
  res.redirect(`/contracts/${req.params.id}`);
};

// ─── Raise dispute ────────────────────────────────────────────────────────────
exports.raiseDispute = async (req, res) => {
  const uid = req.session.userId;
  const [ctRows] = await db.query('SELECT * FROM contracts WHERE id=? AND (client_id=? OR freelancer_id=?)', [req.params.id, uid, uid]);
  if (!ctRows.length) return res.redirect('/dashboard');

  const category = req.body.category || 'other';
  const allowChat = req.body.allow_admin_chat ? 1 : 0;
  await db.query('INSERT INTO disputes (contract_id, raised_by, reason, category, severity, allow_admin_chat) VALUES (?,?,?,?,?,?)',
    [req.params.id, uid, req.body.reason || 'No reason provided', category, 'med', allowChat]);
  await db.query("UPDATE contracts SET status='disputed' WHERE id=?", [req.params.id]);

  const otherPartyId = ctRows[0].client_id === uid ? ctRows[0].freelancer_id : ctRows[0].client_id;
  await createNotification(otherPartyId, 'dispute',
    'A dispute has been raised on one of your contracts. Our team will review within 48 hours.',
    `/contracts/${req.params.id}`
  );
  req.flash('success', 'Dispute raised. Our team will review within 48 hours.');
  res.redirect(`/contracts/${req.params.id}`);
};

// ─── Milestones ────────────────────────────────────────────────────────────────
exports.addMilestone = async (req, res) => {
  const uid = req.session.userId;
  const [ct] = await db.query('SELECT * FROM contracts WHERE id=? AND freelancer_id=? AND status="active"', [req.params.id, uid]);
  if (!ct.length) return res.redirect(`/contracts/${req.params.id}`);
  const { title, description, due_date, amount } = req.body;
  if (!title) { req.flash('error', 'Milestone title is required.'); return res.redirect(`/contracts/${req.params.id}`); }
  const [ord] = await db.query('SELECT COALESCE(MAX(display_order),0)+1 AS next FROM milestones WHERE contract_id=?', [req.params.id]);
  await db.query(
    'INSERT INTO milestones (contract_id, title, description, due_date, amount, display_order) VALUES (?,?,?,?,?,?)',
    [req.params.id, title, description || null, due_date || null, parseFloat(amount) || 0, ord[0].next]
  );
  await createNotification(ct[0].client_id, 'contract',
    `${req.session.userName} added a new milestone: "${title}"`, `/contracts/${req.params.id}`);
  req.flash('success', 'Milestone added.');
  res.redirect(`/contracts/${req.params.id}`);
};

exports.submitMilestone = async (req, res) => {
  const uid = req.session.userId;
  const [ms] = await db.query(
    'SELECT m.*, ct.client_id, ct.freelancer_id FROM milestones m JOIN contracts ct ON m.contract_id=ct.id WHERE m.id=? AND ct.freelancer_id=? AND m.status IN ("pending","revision_requested")',
    [req.params.msId, uid]
  );
  if (!ms.length) return res.redirect(`/contracts/${req.params.id}`);
  await db.query('UPDATE milestones SET status="submitted" WHERE id=?', [ms[0].id]);
  await createNotification(ms[0].client_id, 'contract',
    `${req.session.userName} marked milestone "${ms[0].title}" as done — please review.`, `/contracts/${req.params.id}`);
  req.flash('success', 'Milestone submitted for review.');
  res.redirect(`/contracts/${req.params.id}`);
};

exports.reviewMilestone = async (req, res) => {
  const uid = req.session.userId;
  const [ms] = await db.query(
    'SELECT m.*, ct.client_id, ct.freelancer_id, ct.id AS contract_id FROM milestones m JOIN contracts ct ON m.contract_id=ct.id WHERE m.id=? AND ct.client_id=?',
    [req.params.msId, uid]
  );
  if (!ms.length) return res.redirect(`/contracts/${req.params.id}`);
  const action = req.body.action;
  if (action === 'approve') {
    await db.query('UPDATE milestones SET status="approved" WHERE id=?', [ms[0].id]);
    await createNotification(ms[0].freelancer_id, 'contract',
      `${req.session.userName} approved milestone "${ms[0].title}". Great work!`, `/contracts/${req.params.id}`);
    // Auto-complete contract if all milestones approved
    const [remaining] = await db.query(
      'SELECT COUNT(*) AS c FROM milestones WHERE contract_id=? AND status!="approved"', [req.params.id]
    );
    if (remaining[0].c === 0) {
      const [total] = await db.query('SELECT COUNT(*) AS c FROM milestones WHERE contract_id=?', [req.params.id]);
      if (total[0].c > 0) {
        await db.query('UPDATE contracts SET milestone_pct=100 WHERE id=?', [req.params.id]);
      }
    }
    req.flash('success', 'Milestone approved!');
  } else {
    const note = (req.body.revision_note || '').trim();
    await db.query('UPDATE milestones SET status="revision_requested", revision_note=? WHERE id=?', [note || null, ms[0].id]);
    await createNotification(ms[0].freelancer_id, 'contract',
      `${req.session.userName} requested revision on milestone "${ms[0].title}".`, `/contracts/${req.params.id}`);
    req.flash('success', 'Revision requested.');
  }
  res.redirect(`/contracts/${req.params.id}`);
};

exports.deleteMilestone = async (req, res) => {
  const uid = req.session.userId;
  const [ms] = await db.query(
    'SELECT m.* FROM milestones m JOIN contracts ct ON m.contract_id=ct.id WHERE m.id=? AND ct.freelancer_id=? AND m.status="pending"',
    [req.params.msId, uid]
  );
  if (!ms.length) return res.redirect(`/contracts/${req.params.id}`);
  await db.query('DELETE FROM milestones WHERE id=?', [ms[0].id]);
  req.flash('success', 'Milestone removed.');
  res.redirect(`/contracts/${req.params.id}`);
};

// ─── Change orders ─────────────────────────────────────────────────────────────
exports.requestChangeOrder = async (req, res) => {
  const uid = req.session.userId;
  const [ct] = await db.query('SELECT * FROM contracts WHERE id=? AND freelancer_id=? AND status="active"', [req.params.id, uid]);
  if (!ct.length) return res.redirect(`/contracts/${req.params.id}`);
  const { reason, additional_amount, extra_days } = req.body;
  if (!reason) { req.flash('error', 'Please describe the reason for the change.'); return res.redirect(`/contracts/${req.params.id}`); }
  await db.query(
    'INSERT INTO change_orders (contract_id, requested_by, reason, additional_amount, extra_days) VALUES (?,?,?,?,?)',
    [req.params.id, uid, reason, parseFloat(additional_amount) || 0, parseInt(extra_days) || 0]
  );
  await createNotification(ct[0].client_id, 'contract',
    `${req.session.userName} requested a change order on your contract.`, `/contracts/${req.params.id}`);
  req.flash('success', 'Change order requested.');
  res.redirect(`/contracts/${req.params.id}`);
};

exports.reviewChangeOrder = async (req, res) => {
  const uid = req.session.userId;
  const [co] = await db.query(
    'SELECT co.*, ct.client_id, ct.freelancer_id, ct.agreed_budget FROM change_orders co JOIN contracts ct ON co.contract_id=ct.id WHERE co.id=? AND ct.client_id=? AND co.status="pending"',
    [req.params.coId, uid]
  );
  if (!co.length) return res.redirect(`/contracts/${req.params.id}`);
  const action = req.body.action;
  const note = (req.body.client_note || '').trim();
  await db.query('UPDATE change_orders SET status=?, client_note=? WHERE id=?', [action === 'accept' ? 'accepted' : 'rejected', note || null, co[0].id]);
  if (action === 'accept' && co[0].additional_amount > 0) {
    await db.query('UPDATE contracts SET agreed_budget=agreed_budget+? WHERE id=?', [co[0].additional_amount, req.params.id]);
  }
  await createNotification(co[0].freelancer_id, 'contract',
    `Your change order was ${action === 'accept' ? 'accepted' : 'rejected'}.`, `/contracts/${req.params.id}`);
  req.flash('success', `Change order ${action === 'accept' ? 'accepted' : 'rejected'}.`);
  res.redirect(`/contracts/${req.params.id}`);
};

// ─── Re-hire shortcut ──────────────────────────────────────────────────────────
exports.rehire = async (req, res) => {
  const uid = req.session.userId;
  const [ct] = await db.query(
    'SELECT ct.*, u.name AS freelancer_name FROM contracts ct JOIN users u ON ct.freelancer_id=u.id WHERE ct.id=? AND ct.client_id=? AND ct.status="completed"',
    [req.params.id, uid]
  );
  if (!ct.length) return res.redirect('/client/contracts');
  // Redirect to send-offer page pre-filled with freelancer
  res.redirect(`/freelancers/${ct[0].freelancer_id}/offer`);
};
