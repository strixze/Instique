import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError, ApiResponse } from "../utils/apiUtils.js";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";
import { sendEmail } from "./brevoMail.service.js";

dotenv.config({path:"./.env"});

export const sendVerificationToken = asyncHandler(async(req,res)=>{
    try {
        const user = req.newUser;
        const token = user.generateVerificationToken()

        console.log("User for whom token is generated:", user);
        console.log("Generated Verification Token:", token);


        const userWithToken = await User.findByIdAndUpdate(
            user._id,
            {
                $set:{
                    verificationToken:token,
                    verificationTokenExpiry:"15m"
                }
            },
            {
                new:true
            }
        )

        if(!userWithToken){
            throw new ApiError(500,"Token Creation Error")
        }

        console.log("Verification Token:", userWithToken);

      const htmlTemplate = `
<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0;">
  <head>
    <meta charset="UTF-8" />
    <title>Verify Your DevMark Account</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>

  <body style="margin:0; padding:0; background-color:#f4f6fa; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa; padding:20px 0;">
      <tr>
        <td align="center">

          <table width="600" cellpadding="0" cellspacing="0" style="background:white; border-radius:12px; padding:40px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">

            <tr>
              <td align="center" style="padding-bottom:20px;">
                <div style="font-size:32px; font-weight:700; color:#111;">
                  Dev<span style="color:#4f46e5;">Mark</span>
                </div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-bottom:10px;">
                <h2 style="margin:0; color:#111827; font-size:28px;">Verify Your Email</h2>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-bottom:30px;">
                <p style="margin:0; font-size:16px; color:#4b5563; line-height:1.6;">
                  Click the button below to verify your email address and activate your DevMark account.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-bottom:35px;">
                <a href="https://dev-mark.vercel.app/verify/${userWithToken.verificationToken}"
                   style="display:inline-block; padding:14px 26px; background:linear-gradient(90deg,#4777f4,#9035ea);
                          color:white; font-size:16px; font-weight:600; border-radius:8px; text-decoration:none;">
                  Verify Account
                </a>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-bottom:20px;">
                <hr style="border:none; border-top:1px solid #e5e7eb; width:80%;" />
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:0 20px 30px;">
                <p style="margin:0; font-size:14px; color:#6b7280;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>

                <p style="word-break:break-all; margin-top:8px; font-size:14px; color:#3b82f6;">
                  https://dev-mark.vercel.app/verify/${userWithToken.verificationToken}
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="font-size:12px; color:#9ca3af; padding-top:10px;">
                © 2025 DevMark. All rights reserved.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
`;

const emailResponse = await sendEmail(
  userWithToken.email,
  "Verify your email address to activate your DevMark account",
  htmlTemplate
);


        console.log("Email service response:", emailResponse);

        if(!emailResponse.success){
            throw new ApiError(500,"Email Sending Failed")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,"Verification Token Send On Registered Email")
        )

    } catch (error) {
        console.log("Error in generateVerificationToken:", error);
        return error.message
    }
})