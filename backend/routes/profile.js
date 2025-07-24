const express = require('express');
const router = express.Router();
const { 
    getMyProfile, 
    updateProfile,
    addReview,
    getProfileById // --- NEW ---
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

// Get the profile for the currently logged-in user
router.get('/me', authMiddleware, getMyProfile);

// --- NEW ROUTE ---
// Get a public user profile by their ID
router.get('/:userId', getProfileById);

// Update the profile for the currently logged-in user
router.put('/', authMiddleware, updateProfile);

// Add a review for another user
router.post('/review', authMiddleware, addReview);

module.exports = router;
