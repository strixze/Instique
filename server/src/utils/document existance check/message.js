import { isValidObjectId } from "mongoose"
import { ApiError } from "../apiUtils.js";
import { Message } from "../../models/message.model.js";

export const isMessageExists = async (messageId)=>{
    
   if(!isValidObjectId(messageId)){
       throw new ApiError(400,"Invalid messageId")
   }

   const message = await Message.findById(messageId)

   if(!message){
      throw new ApiError(404,"Message not Found.")
   }
   
   return message
}