// routes/index.js — Mount all route files
const authRoutes         = require('./auth.routes');
const pageRoutes         = require('./pages.routes');
const jobRoutes          = require('./jobs.routes');
const proposalRoutes     = require('./proposals.routes');
const contractRoutes     = require('./contracts.routes');
const profileRoutes      = require('./profile.routes');
const notifRoutes        = require('./notifications.routes');
const messagesRoutes     = require('./messages.routes');
const offersRoutes       = require('./offers.routes');
const adminRoutes        = require('./admin.routes');
const clientRoutes       = require('./client.routes');
const freelancerRoutes   = require('./freelancer.routes');

module.exports = (app) => {
  app.use('/',            authRoutes);
  app.use('/',            pageRoutes);
  app.use('/',            jobRoutes);
  app.use('/',            proposalRoutes);
  app.use('/',            contractRoutes);
  app.use('/',            profileRoutes);
  app.use('/',            notifRoutes);
  app.use('/',            messagesRoutes);
  app.use('/',            offersRoutes);
  app.use('/admin',       adminRoutes);
  app.use('/client',      clientRoutes);
  app.use('/freelancer',  freelancerRoutes);
};
