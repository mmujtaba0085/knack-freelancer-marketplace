// controllers/messages.controller.js
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('../models/notification.model');

const UPLOAD_DIR = path.join(__dirname, '../public/uploads/chat');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

exports.chatUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-z0-9._-]/gi, '_')}`)
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

async function assertProposalAccess(propId, uid) {
  const [r] = await db.query(
    'SELECT p.id FROM proposals p JOIN jobs j ON p.job_id=j.id WHERE p.id=? AND (p.freelancer_id=? OR j.client_id=?)',
    [propId, uid, uid]
  );
  return r.length > 0;
}

async function assertContractAccess(ctId, uid) {
  const [r] = await db.query('SELECT id FROM contracts WHERE id=? AND (client_id=? OR freelancer_id=?)', [ctId, uid, uid]);
  return r.length > 0;
}

// Notify the other party about a new message — rate-limited to once per 5 min per thread
async function notifyNewMessage(senderName, recipientId, threadType, threadId, jobTitle) {
  const col = threadType === 'proposal' ? 'proposal_id' : 'contract_id';
  const link = threadType === 'proposal' ? `/proposals/${threadId}/chat` : `/contracts/${threadId}/chat`;

  // Only send a notification if no notification was sent for this thread in the last 5 minutes
  const [recent] = await db.query(`
    SELECT id FROM notifications
    WHERE user_id=? AND link=? AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    LIMIT 1
  `, [recipientId, link]);

  if (!recent.length) {
    await createNotification(
      recipientId, 'system',
      `New message from ${senderName} — "${jobTitle.substring(0, 50)}${jobTitle.length > 50 ? '…' : ''}"`,
      link
    );
  }
}

// ─── GET /messages (inbox) ────────────────────────────────────────────────────
exports.inbox = async (req, res) => {
  const uid = req.session.userId;

  // UNION of proposal threads + contract threads that have messages and involve this user
  const [threads] = await db.query(`
    (
      SELECT
        p.id           AS thread_id,
        'proposal'     AS thread_type,
        j.title        AS job_title,
        p.status       AS thread_status,
        IF(p.freelancer_id = ?, j.client_id,   p.freelancer_id) AS other_id,
        IF(p.freelancer_id = ?, cl.name,        fl.name)         AS other_name,
        IF(p.freelancer_id = ?, cl.avatar_url,  fl.avatar_url)   AS other_avatar,
        (SELECT body      FROM messages WHERE proposal_id = p.id ORDER BY created_at DESC LIMIT 1) AS last_body,
        (SELECT file_type FROM messages WHERE proposal_id = p.id ORDER BY created_at DESC LIMIT 1) AS last_file_type,
        (SELECT created_at FROM messages WHERE proposal_id = p.id ORDER BY created_at DESC LIMIT 1) AS last_at,
        (SELECT COUNT(*)  FROM messages WHERE proposal_id = p.id) AS msg_count,
        (SELECT COUNT(*)  FROM messages WHERE proposal_id = p.id AND sender_id != ?) AS unread_approx
      FROM proposals p
      JOIN jobs j  ON p.job_id = j.id
      JOIN users fl ON p.freelancer_id = fl.id
      JOIN users cl ON j.client_id     = cl.id
      WHERE (p.freelancer_id = ? OR j.client_id = ?)
        AND EXISTS (SELECT 1 FROM messages WHERE proposal_id = p.id)
    )
    UNION ALL
    (
      SELECT
        ct.id          AS thread_id,
        'contract'     AS thread_type,
        j.title        AS job_title,
        ct.status      AS thread_status,
        IF(ct.freelancer_id = ?, ct.client_id,  ct.freelancer_id) AS other_id,
        IF(ct.freelancer_id = ?, cl.name,        fl.name)          AS other_name,
        IF(ct.freelancer_id = ?, cl.avatar_url,  fl.avatar_url)    AS other_avatar,
        (SELECT body      FROM messages WHERE contract_id = ct.id ORDER BY created_at DESC LIMIT 1) AS last_body,
        (SELECT file_type FROM messages WHERE contract_id = ct.id ORDER BY created_at DESC LIMIT 1) AS last_file_type,
        (SELECT created_at FROM messages WHERE contract_id = ct.id ORDER BY created_at DESC LIMIT 1) AS last_at,
        (SELECT COUNT(*)  FROM messages WHERE contract_id = ct.id) AS msg_count,
        (SELECT COUNT(*)  FROM messages WHERE contract_id = ct.id AND sender_id != ?) AS unread_approx
      FROM contracts ct
      JOIN jobs j  ON ct.job_id        = j.id
      JOIN users fl ON ct.freelancer_id = fl.id
      JOIN users cl ON ct.client_id     = cl.id
      WHERE (ct.client_id = ? OR ct.freelancer_id = ?)
        AND EXISTS (SELECT 1 FROM messages WHERE contract_id = ct.id)
    )
    ORDER BY last_at DESC
  `, [uid, uid, uid, uid, uid, uid, uid, uid, uid, uid, uid, uid]);

  res.render('shared/inbox', { threads, user: req.session });
};

// ─── GET /proposals/:id/chat ──────────────────────────────────────────────────
exports.proposalChat = async (req, res) => {
  const uid = req.session.userId;
  const [props] = await db.query(`
    SELECT p.*, j.title AS job_title, j.client_id, j.id AS job_id,
      fl.name AS freelancer_name, fl.avatar_url AS freelancer_avatar,
      cl.name AS client_name,     cl.avatar_url AS client_avatar
    FROM proposals p
    JOIN jobs j ON p.job_id = j.id
    JOIN users fl ON p.freelancer_id = fl.id
    JOIN users cl ON j.client_id = cl.id
    WHERE p.id=? AND (p.freelancer_id=? OR j.client_id=?)
  `, [req.params.id, uid, uid]);
  if (!props.length) return res.redirect('/dashboard');

  const proposal = props[0];
  const [messages] = await db.query(`
    SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
    FROM messages m JOIN users u ON m.sender_id=u.id
    WHERE m.proposal_id=? ORDER BY m.created_at ASC
  `, [proposal.id]);

  const isClient = proposal.client_id === uid;
  res.render('shared/chat', {
    proposal, contract: null, messages, isClient,
    backUrl: isClient ? `/client/proposals/${proposal.job_id}` : '/freelancer/applications',
    user: req.session
  });
};

// ─── GET /contracts/:id/chat ──────────────────────────────────────────────────
exports.contractChat = async (req, res) => {
  const uid = req.session.userId;
  const [cts] = await db.query(`
    SELECT ct.*, j.title AS job_title,
      fl.name AS freelancer_name, fl.avatar_url AS freelancer_avatar,
      cl.name AS client_name,     cl.avatar_url AS client_avatar
    FROM contracts ct
    JOIN jobs j ON ct.job_id = j.id
    JOIN users fl ON ct.freelancer_id = fl.id
    JOIN users cl ON ct.client_id = cl.id
    WHERE ct.id=? AND (ct.client_id=? OR ct.freelancer_id=?)
  `, [req.params.id, uid, uid]);
  if (!cts.length) return res.redirect('/dashboard');

  const contract = cts[0];
  const [messages] = await db.query(`
    SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
    FROM messages m JOIN users u ON m.sender_id=u.id
    WHERE m.contract_id=? ORDER BY m.created_at ASC
  `, [contract.id]);

  const isClient = contract.client_id === uid;
  res.render('shared/chat', {
    proposal: null, contract, messages, isClient,
    backUrl: `/contracts/${contract.id}`,
    user: req.session
  });
};

// ─── POST /messages/send ──────────────────────────────────────────────────────
exports.send = async (req, res) => {
  const uid    = req.session.userId;
  const propId = req.body.proposal_id ? parseInt(req.body.proposal_id) : null;
  const ctId   = req.body.contract_id ? parseInt(req.body.contract_id) : null;
  const body   = (req.body.body || '').trim();

  if (!propId && !ctId) return res.redirect('/dashboard');

  let recipientId = null, jobTitle = '';

  if (propId) {
    const [r] = await db.query(
      'SELECT p.freelancer_id, j.client_id, j.title FROM proposals p JOIN jobs j ON p.job_id=j.id WHERE p.id=? AND (p.freelancer_id=? OR j.client_id=?)',
      [propId, uid, uid]
    );
    if (!r.length) return res.redirect('/dashboard');
    recipientId = r[0].freelancer_id === uid ? r[0].client_id : r[0].freelancer_id;
    jobTitle    = r[0].title;
  } else {
    const [r] = await db.query(
      'SELECT ct.client_id, ct.freelancer_id, j.title FROM contracts ct JOIN jobs j ON ct.job_id=j.id WHERE ct.id=? AND (ct.client_id=? OR ct.freelancer_id=?)',
      [ctId, uid, uid]
    );
    if (!r.length) return res.redirect('/dashboard');
    recipientId = r[0].client_id === uid ? r[0].freelancer_id : r[0].client_id;
    jobTitle    = r[0].title;
  }

  let fileUrl = null, fileType = null, fileName = null;
  if (req.file) {
    fileUrl  = `/uploads/chat/${req.file.filename}`;
    fileName = req.file.originalname;
    const mt = req.file.mimetype;
    fileType = mt.startsWith('image/') ? 'image' : mt === 'application/pdf' ? 'pdf' : 'file';
  }

  if (!body && !req.file) {
    return res.redirect(propId ? `/proposals/${propId}/chat` : `/contracts/${ctId}/chat`);
  }

  await db.query(
    'INSERT INTO messages (proposal_id, contract_id, sender_id, body, file_url, file_type, file_name) VALUES (?,?,?,?,?,?,?)',
    [propId, ctId, uid, body || null, fileUrl, fileType, fileName]
  );

  // Notify the other party (rate-limited to once per 5 min per thread)
  await notifyNewMessage(
    req.session.userName, recipientId,
    propId ? 'proposal' : 'contract',
    propId || ctId, jobTitle
  );

  res.redirect(propId ? `/proposals/${propId}/chat` : `/contracts/${ctId}/chat`);
};

// ─── GET /api/contracts/:id/messages (polling) ────────────────────────────────
exports.poll = async (req, res) => {
  const uid   = req.session.userId;
  const cid   = parseInt(req.params.id);
  const after = parseInt(req.query.after) || 0;
  const ok = await assertContractAccess(cid, uid);
  if (!ok) return res.json([]);
  const [msgs] = await db.query(`
    SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
    FROM messages m JOIN users u ON m.sender_id=u.id
    WHERE m.contract_id=? AND m.id>? ORDER BY m.created_at ASC
  `, [cid, after]);
  res.json(msgs);
};

// ─── GET /api/proposals/:id/messages (polling) ────────────────────────────────
exports.pollProposal = async (req, res) => {
  const uid   = req.session.userId;
  const pid   = parseInt(req.params.id);
  const after = parseInt(req.query.after) || 0;
  const ok = await assertProposalAccess(pid, uid);
  if (!ok) return res.json([]);
  const [msgs] = await db.query(`
    SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
    FROM messages m JOIN users u ON m.sender_id=u.id
    WHERE m.proposal_id=? AND m.id>? ORDER BY m.created_at ASC
  `, [pid, after]);
  res.json(msgs);
};
