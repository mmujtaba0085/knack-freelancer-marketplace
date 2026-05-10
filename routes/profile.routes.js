// routes/profile.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/profile.controller');
const { requireLogin } = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Sharp is optional — install with: npm install sharp
let sharp;
try { sharp = require('sharp'); } catch { sharp = null; }

const UPLOAD_DIR = path.join(__dirname, '../public/uploads');

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed (jpg, png, webp, etc.).'));
    }
    cb(null, true);
  }
});

// Process avatar buffer: resize with sharp if available, otherwise save as-is
async function processAvatar(req, res, next) {
  if (!req.file) return next();
  try {
    const ext      = sharp ? '.webp' : (path.extname(req.file.originalname).toLowerCase() || '.jpg');
    const filename = `${Date.now()}-avatar${ext}`;
    const dest     = path.join(UPLOAD_DIR, filename);

    if (sharp) {
      await sharp(req.file.buffer)
        .resize(200, 200, { fit: 'cover', position: 'attention' })
        .webp({ quality: 85 })
        .toFile(dest);
    } else {
      fs.writeFileSync(dest, req.file.buffer);
    }

    req.file.filename = filename;
    next();
  } catch (err) {
    next(err);
  }
}

router.get('/profile',              requireLogin, ctrl.editProfile);
router.post('/profile',             requireLogin, avatarUpload.single('avatar'), processAvatar, ctrl.saveProfile);
router.get('/profile/:id',                        ctrl.view);
router.post('/portfolio',           requireLogin, avatarUpload.single('image'), processAvatar, ctrl.addPortfolioItem);
router.post('/portfolio/:id/delete',requireLogin, ctrl.deletePortfolioItem);

module.exports = router;
