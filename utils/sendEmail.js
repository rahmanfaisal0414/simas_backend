const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Mengirim email
 * @param {string} to 
 * @param {string} subject
 * @param {string} content 
 * @param {boolean} isHtml
 * @returns {Promise<boolean>}
 */
const sendEmail = async (to, subject, content, isHtml = false) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
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
