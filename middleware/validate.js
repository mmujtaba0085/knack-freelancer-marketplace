// middleware/validate.js — express-validator rules for all forms
const { body, validationResult } = require('express-validator');

// ─── Auth ─────────────────────────────────────────────────────────────────────
exports.signupRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }).escape(),
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('role').isIn(['client', 'freelancer']).withMessage('Select a valid role'),
];

exports.loginRules = [
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.forgotRules = [
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
];

exports.resetRules = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
  body('password_confirm').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
];

// ─── Jobs ─────────────────────────────────────────────────────────────────────
exports.jobRules = [
  body('title').trim().isLength({ min: 10, max: 200 }).withMessage('Title must be 10–200 characters').escape(),
  body('description').trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters').escape(),
  body('budget_min').isFloat({ min: 1 }).withMessage('Minimum budget must be at least $1'),
  body('budget_max').isFloat({ min: 1 }).withMessage('Maximum budget must be at least $1')
    .custom((v, { req }) => {
      if (parseFloat(v) < parseFloat(req.body.budget_min))
        throw new Error('Maximum budget must be greater than minimum');
      return true;
    }),
  body('level').isIn(['entry', 'intermediate', 'expert']).withMessage('Select a valid experience level'),
];

// ─── Proposals ────────────────────────────────────────────────────────────────
exports.proposalRules = [
  body('cover_letter').trim().isLength({ min: 100 }).withMessage('Cover letter must be at least 100 characters').escape(),
  body('proposed_budget').isFloat({ min: 1 }).withMessage('Enter a valid budget'),
  body('estimated_days').isInt({ min: 1 }).withMessage('Enter estimated days (minimum 1)'),
];

// ─── Reviews ──────────────────────────────────────────────────────────────────
exports.reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
  body('comment').trim().isLength({ min: 20 }).withMessage('Comment must be at least 20 characters').escape(),
];

// ─── Contact ──────────────────────────────────────────────────────────────────
exports.contactRules = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('message').trim().isLength({ min: 20 }).withMessage('Message must be at least 20 characters').escape(),
];

// ─── Error handler (returns errors as array on req for controller to use) ─────
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.validationErrors = errors.array();
  }
  next();
};
