const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getLoggedInUser } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST api/auth/login
// @desc    Authenticate a user and get a token
// @access  Public
router.post('/login', loginUser);

// @route   GET api/auth
// @desc    Get the currently logged-in user's data
// @access  Private (requires a valid token)
router.get('/', authMiddleware, getLoggedInUser);

module.exports = router;
