const express = require('express');
const router = express.Router();
const { getMyMegaCoins, getMegaCoinSettings, updateMegaCoinSettings, adjustUserMegaCoins, getAllUsersMegaCoins } = require('../controllers/megacoinController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/settings', getMegaCoinSettings);
router.get('/my', protect, getMyMegaCoins);

// Admin
router.put('/admin/settings', protect, adminOnly, updateMegaCoinSettings);
router.post('/admin/adjust', protect, adminOnly, adjustUserMegaCoins);
router.get('/admin/users', protect, adminOnly, getAllUsersMegaCoins);

module.exports = router;
