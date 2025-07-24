const express = require('express');
const router = express.Router();
const { getAllSkills } = require('../controllers/skillController');

// @route   GET api/skills
// @desc    Get all available skills, with optional filtering by search query or category
// @access  Public
router.get('/', getAllSkills);

module.exports = router;
