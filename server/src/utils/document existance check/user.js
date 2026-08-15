
import mongoose from "mongoose"
import { User } from "../../models/user.model.js"

export const isUserExists = async (userId)=>{
    
   if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400,"Invalid userId")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404,"User not found")
    }

    return user
}