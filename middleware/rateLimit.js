const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // maksimal 5 request OTP per 15 menit
  message: { message: 'Terlalu banyak percobaan, coba lagi nanti.' }
});

module.exports = { otpLimiter };
