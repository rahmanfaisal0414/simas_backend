module.exports = (req, res, next) => {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }
    
    next();
  };
  