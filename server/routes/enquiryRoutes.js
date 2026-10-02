const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { requireAuth } = require('../middleware/auth');

// Public enquiry submission
router.post('/', enquiryController.submitEnquiry);

// Admin management
router.get('/', requireAuth, enquiryController.listEnquiries);
router.put('/:id', requireAuth, enquiryController.updateEnquiry);
router.delete('/:id', requireAuth, enquiryController.deleteEnquiry);

module.exports = router;

