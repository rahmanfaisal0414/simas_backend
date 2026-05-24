const axios = require("axios");
require("dotenv").config();

const sendEmail = async (to, subject, content, isHtml = false) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderName = process.env.BREVO_SENDER_NAME || "SIMAS";
    const senderEmail = process.env.BREVO_SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
      console.error("❌ BREVO_API_KEY atau BREVO_SENDER_EMAIL belum diset");
      return false;
    }

    const payload = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      ...(isHtml ? { htmlContent: content } : { textContent: content }),
    };

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      payload,
      {
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log("✅ Email Brevo API terkirim:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Brevo API Send Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return false;
  }
};

module.exports = sendEmail;