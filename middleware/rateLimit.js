const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, 
  message: { message: 'Terlalu banyak percobaan, coba lagi nanti.' }
});

module.exports = { otpLimiter };
