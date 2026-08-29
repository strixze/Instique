import SibApiV3Sdk from "sib-api-v3-sdk";

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

/**
 * @description Custom Utility Function for Sending Mail Using Brevo Mail Service
 * @param {String} to - Receiver Email Address
 * @param {String} subject - Subject of Email
 * @param {String} html - HTML Content
 * @param {String} [receiverName] - Optional Receiver Name
 */
const sendEmail = async (to, subject, html, receiverName = "User") => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const senderEmail = process.env.BREVO_SENDER_EMAIL || "bytecoder95@gmail.com";
  const senderName = process.env.BREVO_SENDER_NAME || "Instique Admin";

  const sendSmtpEmail = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: to, name: receiverName || "User" }],
    subject: subject,
    htmlContent: html
  };

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email sent successfully to:", to);
    return { success: true, data };
  } catch (error) {
    const errorMessage = error.response?.body?.message || error.message || "Email delivery failed";
    console.error("❌ Error sending email to:", to, "Reason:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

export { sendEmail };

