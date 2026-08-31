import { isValidObjectId } from "mongoose"
import { Chat } from "../../models/chat.model.js"
import { ApiError } from "../apiUtils.js";

export const isChatExists = async (chatId)=>{
    
   if(!isValidObjectId(chatId)){
       throw new ApiError(400,"Invalid chatId")
   }

   const chat = await Chat.findById(chatId)

   if(!chat){
      throw new ApiError(404,"Chat not Found.")
   }
   
   return chat
}