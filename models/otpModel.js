const pool = require('../config/db');

const saveOtp = async (email, otp, expiresAt) => {
    await pool.query(
        `INSERT INTO password_reset (email, otp, expires_at) VALUES ($1, $2, $3)`,
        [email, otp, expiresAt]
    );
};

const findOtp = async (email, otp) => {
    const res = await pool.query(
        `SELECT * FROM password_reset 
         WHERE email = $1 AND otp = $2 AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email, otp]
    );
    return res.rows[0];
};

const deleteOtp = async (email) => {
    await pool.query(`DELETE FROM password_reset WHERE email = $1`, [email]);
};

module.exports = { saveOtp, findOtp, deleteOtp };
