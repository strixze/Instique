import { generateOTP } from "./generateOTP.js";
import { sendEmail } from "./brevoMail.service.js";


export const sendOTP = (email) =>{
  try {
    const otp = generateOTP();
    const emailResponse = sendEmail(
        email,
        "Your Password Reset OTP",
        `Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.`
    );

    console.log("Email service response:", emailResponse);

    if(!emailResponse.success){
        throw new Error("Email Sending Failed");
    }
    return otp;
  } catch (error) {
    console.log("Error in sendOTP:", error);
    return null;
  }
}