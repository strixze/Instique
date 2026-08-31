import { ApiError } from "../utils/apiUtils.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "./multer.middleware.js";


export const draftImage = asyncHandler(async(req,res,next)=>{
    if(req.headers["x-has-draft-image"] && req.headers["x-has-draft-image"]==="true"){
        upload.array("images",5)(req,res,(error)=>{
            if(error){
                throw new ApiError(400,"Image Upload Failed: "+error.message)
            }
            next()
        })
    }else{
        next()
    }
})