// routes/auth.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/auth.controller');
const { loginRules, signupRules, forgotRules, resetRules, validate } = require('../middleware/validate');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimiter');

router.get('/login',            ctrl.getLogin);
router.post('/login',           loginLimiter, loginRules, validate, ctrl.postLogin);
router.get('/signup',           ctrl.getSignup);
router.post('/signup',          signupLimiter, signupRules, validate, ctrl.postSignup);
router.get('/logout',           ctrl.logout);
router.get('/verify-email',     ctrl.getVerify);
router.post('/verify-email',    ctrl.postVerify);
router.post('/resend-code',     ctrl.postResendCode);
router.get('/forgot-password',  ctrl.getForgot);
router.post('/forgot-password', forgotRules, validate, ctrl.postForgot);
router.get('/reset-password',   ctrl.getReset);
router.post('/reset-password',  resetRules, validate, ctrl.postReset);

module.exports = router;
