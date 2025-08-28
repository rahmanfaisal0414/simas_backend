const express = require('express');
const { login, forgotPassword, verifyOtp, newPassword, getProfile, changePassword, loginWithGoogle} = require('../controllers/authController');
const { otpLimiter } = require('../middleware/rateLimit');
const validateEmail = require('../middleware/validateEmail');
const validatePassword = require('../middleware/validatePassword');
const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', otpLimiter, validateEmail, forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/new-password', validatePassword, newPassword);
router.get('/profile', getProfile);
router.put('/change-password', changePassword);
router.post('/google', loginWithGoogle);


module.exports = router;


