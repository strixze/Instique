import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiUtils.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import dotenv from "dotenv"

dotenv.config({path:"./.env"})

const userAuth = asyncHandler(async (req,res,next)=>{
    const {accessToken} = req.cookies;
    // console.log("Access Token From Cookies : ",accessToken);

    if(!accessToken || accessToken.trim()===""){
       if(req.headers["x-auth-check-type"] && req.headers["x-auth-check-type"] === "login-check-hit"){
        return res
                .status(200)
                .json(
                    {
                        success: false,
                        isLoggedIn : false
                    }
                )
       }
        throw new ApiError(401,"Unauthorize User");
    }

    let decodedToken;

    try {
        decodedToken = jwt.verify(accessToken,process.env.JWT_ACCESS_SECRET)

    } catch (error) {
        throw new ApiError(401,"Error While Decoding AccessToken")
    }

    if(!decodedToken){
        throw new ApiError(401,"No Decoded Token Found")
    }

    // console.log("Decoded Token in Auth Middleware : ",decodedToken);

    const user = await User.findById(decodedToken._id).select("-password")

    req.user = user

    next();
})

export {userAuth}