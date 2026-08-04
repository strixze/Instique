import SibApiV3Sdk from "sib-api-v3-sdk";

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; // from Render env var


/**
 * @description Custom Utility Function for Sending Mail Using Brevo Mail Sevice
 * @param {String} to - Receiver
 * @param {String} subject - Subject of Email
 * @param {String} html - Html content
 */
const sendEmail = async (to,subject,html) => {
  
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = {
    sender: { email: "bytecoder95@gmail.com", name: "DevMark Admin" },
    to: [{ email: to, name: "Test User" }],
    subject: subject,
    htmlContent: html
  };

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Error sending email:", error.response?.body || error);
  }
};

export { sendEmail };
