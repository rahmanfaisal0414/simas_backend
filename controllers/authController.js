const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const { findUserByEmail, updatePassword, findUserById, updatePasswordById  } = require('../models/userModel');
const { saveOtp, findOtp, deleteOtp } = require('../models/otpModel');
require('dotenv').config();

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await findUserByEmail(email);
        if (!user) return res.status(400).json({ message: 'Email tidak ditemukan' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ message: 'Password salah' });

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        res.json({
            user_id: user.id,
            token,
            username: user.username,
            email: user.email || '',
            avatar_url: user.avatar_url || '/uploads/avatars/base_profil.png'
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await findUserByEmail(email);
        if (!user) return res.status(400).json({ message: 'Email tidak ditemukan' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60000); 

        await saveOtp(email, otp, expiresAt);

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; text-align: center;">
                <h2 style="color: #3B82F6;">SIMAS - Reset Password</h2>
                <p>Kode OTP Anda adalah:</p>
                <h1 style="letter-spacing: 5px;">${otp}</h1>
                <p>Berlaku selama <b>5 menit</b>. Jangan bagikan kode ini kepada siapa pun.</p>
            </div>
        `;

        const emailSent = await sendEmail(email, 'Kode OTP Reset Password', htmlContent, true);

        if (!emailSent) {
            return res.status(500).json({ message: 'Gagal mengirim email OTP, coba lagi nanti' });
        }

        res.json({ message: 'OTP telah dikirim ke email' });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpData = await findOtp(email, otp);
        if (!otpData) {
            return res.status(400).json({ message: 'OTP salah atau kadaluarsa' });
        }
        res.json({ message: 'OTP valid' });
    } catch (err) {
        console.error("Verify OTP Error:", err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

const newPassword = async (req, res) => {
    try {
        const { email, password, otp } = req.body;
        const otpData = await findOtp(email, otp);
        if (!otpData) {
            return res.status(400).json({ message: 'OTP belum diverifikasi atau kadaluarsa' });
        }

        const hashed = await bcrypt.hash(password, 10);
        await updatePassword(email, hashed);

        await deleteOtp(email);

        res.json({ message: 'Password berhasil direset' });
    } catch (err) {
        console.error("New Password Error:", err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

const getProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await findUserById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

const changePassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { oldPassword, newPassword } = req.body;

    const user = await findUserById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Password lama salah' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await updatePasswordById(user.id, hashed);

    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};


module.exports = { login, forgotPassword, verifyOtp, newPassword, getProfile, changePassword };
