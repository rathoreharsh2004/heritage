const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public file streaming from GridFS
router.get('/:id', mediaController.getMediaById);
router.get('/file/:filename', mediaController.getMediaByName);

// Admin media management
router.get('/', requireAuth, mediaController.listMedia);
router.get('/:id/usage', requireAuth, mediaController.getMediaUsage);
router.post('/upload', requireAuth, upload.single('file'), mediaController.uploadMedia);
router.put('/:id', requireAuth, mediaController.updateMedia);
router.delete('/:id', requireAuth, mediaController.deleteMedia);

module.exports = router;

