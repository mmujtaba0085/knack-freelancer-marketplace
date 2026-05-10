// middleware/auth.js — Session-based authentication guards

exports.requireLogin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    // Save the intended destination so login can redirect back
    if (req.method === 'GET') req.session.returnTo = req.originalUrl;
    req.flash('error', 'Please sign in to continue.');
    return res.redirect('/login');
  }
  next();
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  if (req.session.role !== role) {
    return res.status(403).render('shared/403', {
      user: req.session,
      message: `This area is restricted to ${role}s.`
    });
  }
  next();
};

// Attach user session data to res.locals so every EJS template can access it
exports.attachUser = (req, res, next) => {
  res.locals.sessionUser = req.session.userId ? {
    id:        req.session.userId,
    name:      req.session.userName,
    role:      req.session.role,
    avatarUrl: req.session.avatarUrl || null,
  } : null;
  res.locals.flashSuccess = req.flash('success');
  res.locals.flashError   = req.flash('error');
  next();
};
