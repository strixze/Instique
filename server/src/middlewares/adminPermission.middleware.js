import { ApiError } from "../utils/apiUtils.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { isChatExists } from "../utils/document existance check/chat.js"

export const adminPermission = asyncHandler(async(req,res,next)=>{
   const groupId = req.body?.groupId || req.params?.id

   if(!groupId){
    throw new ApiError(400,"GroupId is Required")
   }else{

    const group = await isChatExists(groupId)

    if(!group){
        throw new ApiError(400,"GroupId is Required")
    }

    
    if(!group?.isGroupChat){
        throw new ApiError(400,"Not a group chat")
    }

    if(group.admins.some(a => a.toString() === req.user._id.toString())){
        req.group = group
        next()
    } else {
        throw new ApiError(403,"You are not an admin of this group")
    }
}
})