const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Mengirim email
 * @param {string} to - Alamat email tujuan
 * @param {string} subject - Subjek email
 * @param {string} content - Konten email (bisa HTML atau teks biasa)
 * @param {boolean} isHtml - Jika true maka content dianggap HTML
 * @returns {Promise<boolean>} - true jika berhasil, false jika gagal
 */
const sendEmail = async (to, subject, content, isHtml = false) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // bisa ganti SMTP lain jika perlu
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"SIMAS" <${process.env.EMAIL_USER}>`,
      to,
      subject
    };

    // Tentukan apakah mengirim HTML atau teks
    if (isHtml) {
      mailOptions.html = content;
    } else {
      mailOptions.text = content;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email terkirim ke ${to}: ${info.response}`);
    return true;
  } catch (error) {
    console.error(`❌ Gagal mengirim email ke ${to}:`, error.message);
    return false;
  }
};

module.exports = sendEmail;
