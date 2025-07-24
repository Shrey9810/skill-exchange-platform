const express = require('express');
const router = express.Router();
const { generateBio, suggestSkills } = require('../controllers/geminiController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST api/gemini/generate-bio
// @desc    Generate a user bio using the Gemini AI
// @access  Private
router.post('/generate-bio', authMiddleware, generateBio);

// @route   POST api/gemini/suggest-skills
// @desc    Suggest skills for a user based on a role/interest using the Gemini AI
// @access  Private
router.post('/suggest-skills', authMiddleware, suggestSkills);

module.exports = router;
