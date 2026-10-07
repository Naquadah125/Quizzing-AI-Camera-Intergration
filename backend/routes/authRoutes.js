const express = require('express');
const router = express.Router();
const { login, getMe, updateProfile, seedAdmin } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.post('/seed-admin', seedAdmin);

router.get('/me', authenticate, getMe);
router.put('/update-profile', authenticate, updateProfile);

module.exports = router;
