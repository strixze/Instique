import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" })

export const sendEmail = async(to,subject,text,html="<p>Welcome To DevMark</p>")=>{

    console.log(process.env.EMAIL_HOST, process.env.EMAIL_PORT, process.env.EMAIL_USER, process.env.EMAIL_PASSWORD);
    const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
})

    console.log("Sending email to:", to);
    const info = await transporter.sendMail({
        from:`"Founder of DevMark " <${to}>`,
        to,
        subject,
        text,
        html
    })

    if(!info){
        return {
            success:false,
            message:"Email Sending Failed"
        }
    }

    console.log("Email sent:", info);

    return {
        success:true,
        message:"Email Sent Successfully",
        info
    }
}