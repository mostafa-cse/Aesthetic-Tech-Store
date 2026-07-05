const express = require('express');
const router = express.Router();
const { submitReturnRequest, getMyReturns, getAllReturns, updateReturnStatus } = require('../controllers/returnController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadReturnEvidence } = require('../config/cloudinary');

router.post('/', protect, uploadReturnEvidence.array('evidence', 5), submitReturnRequest);
router.get('/my', protect, getMyReturns);

// Admin
router.get('/admin', protect, adminOnly, getAllReturns);
router.put('/admin/:id', protect, adminOnly, updateReturnStatus);

module.exports = router;
