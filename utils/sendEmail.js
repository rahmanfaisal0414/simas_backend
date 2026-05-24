const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Mengirim email menggunakan Gmail SMTP
 * @param {string} to
 * @param {string} subject
 * @param {string} content
 * @param {boolean} isHtml
 * @returns {Promise<boolean>}
 */
const sendEmail = async (to, subject, content, isHtml = false) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, "");

    if (!emailUser || !emailPass) {
      console.error("❌ EMAIL_USER atau EMAIL_PASS belum diset");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },

      // penting biar Railway tidak nunggu 120 detik
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    const mailOptions = {
      from: `"SIMAS" <${emailUser}>`,
      to,
      subject,
      ...(isHtml ? { html: content } : { text: content }),
    };

    console.log("📧 Mulai kirim email OTP ke:", to);

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email terkirim ke ${to}: ${info.response}`);
    return true;
  } catch (error) {
    console.error("❌ Gmail SMTP Send Error:", {
      code: error.code,
      command: error.command,
      message: error.message,
      response: error.response,
    });

    return false;
  }
};

module.exports = sendEmail;