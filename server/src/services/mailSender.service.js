import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import dotenv from "dotenv";

dotenv.config({path:"./.env"})

const sendEmail = async ({ to, clientName, subject, htmlContent }) => {
    const mailerSend = new MailerSend({
        apiKey: process.env.MAILSENDER_API_TOKEN,
    });

    const sentFrom = new Sender(process.env.EMAIL_USER, "DevMark Team");

    const recipients = [
        new Recipient(to, clientName)
    ];

    const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setReplyTo(sentFrom)
        .setSubject(subject)
        .setHtml(htmlContent)
        .setText(htmlContent);

    await mailerSend.email.send(emailParams);
}

export { sendEmail };