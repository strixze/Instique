import mongoose from "mongoose";

export const generateTokens = (user)=>{
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    return { accessToken, refreshToken }
}
