const express = require('express');
const router = express.Router();
const { 
    createExchange, 
    getMyExchanges, 
    updateExchangeStatus, 
    getExchangeById,
    completeExchange,
    getNotificationCounts,  // --- NEW ---
    markNotificationsAsSeen // --- NEW ---
} = require('../controllers/exchangeController');
const authMiddleware = require('../middleware/authMiddleware');

// --- NEW ROUTES ---
router.get('/notifications/counts', authMiddleware, getNotificationCounts);
router.put('/notifications/seen', authMiddleware, markNotificationsAsSeen);
// --- END NEW ROUTES ---

router.post('/', authMiddleware, createExchange);
router.get('/', authMiddleware, getMyExchanges);
router.get('/:id', authMiddleware, getExchangeById);
router.put('/:id/status', authMiddleware, updateExchangeStatus);
router.put('/:id/complete', authMiddleware, completeExchange);

module.exports = router;
