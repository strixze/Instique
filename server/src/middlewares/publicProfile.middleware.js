import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiUtils.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import dotenv from "dotenv"
import mongoose from "mongoose";

dotenv.config({path:"./.env"})

const publicProfile = asyncHandler(async (req,res,next)=>{
   const id = req.params.id

   if(!id || !mongoose.Types.ObjectId.isValid(id)){
    throw new ApiError(400,"Valid User ID Is Required.")
   }

   const user = await User.findById(id)

   if(!user){
    throw new ApiError(500,"Server Error While Fetching User.")
   }

   req.user = user;

   next()
})

export {publicProfile}