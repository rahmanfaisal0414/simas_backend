const nodemailer = require("nodemailer");
require("dotenv").config();

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
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });

    await transporter.verify();
    console.log("✅ Gmail SMTP ready");

    const mailOptions = {
      from: `"SIMAS" <${emailUser}>`,
      to,
      subject,
      ...(isHtml ? { html: content } : { text: content }),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email terkirim ke ${to}: ${info.response}`);
    return true;
  } catch (error) {
    console.error("❌ Send Email Error:", {
      code: error.code,
      command: error.command,
      message: error.message,
      response: error.response,
    });

    return false;
  }
};

module.exports = sendEmail;