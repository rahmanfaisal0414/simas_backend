const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (to, subject, content, isHtml = false) => {
  try {
    const smtpHost = process.env.BREVO_SMTP_HOST;
    const smtpPort = Number(process.env.BREVO_SMTP_PORT || 587);
    const smtpUser = process.env.BREVO_SMTP_USER;
    const smtpPass = process.env.BREVO_SMTP_PASS;

    const senderName = process.env.BREVO_SENDER_NAME || "SIMAS";
    const senderEmail = process.env.BREVO_SENDER_EMAIL;

    if (!smtpHost || !smtpUser || !smtpPass || !senderEmail) {
      console.error("❌ Brevo SMTP env belum lengkap");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      ...(isHtml ? { html: content } : { text: content }),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email Brevo terkirim ke ${to}: ${info.response}`);
    return true;
  } catch (error) {
    console.error("❌ Brevo SMTP Send Error:", {
      code: error.code,
      command: error.command,
      message: error.message,
      response: error.response,
    });

    return false;
  }
};

module.exports = sendEmail;