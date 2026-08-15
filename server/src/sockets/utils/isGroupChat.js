import { isValidObjectId } from "mongoose";
import { Chat } from "../../models/chat.model.js";

export const isGroupChat = async(chatId)=>{
    if(!isValidObjectId(chatId)){
        return false;
    }

    const group = await Chat.findById(chatId);

    if(group?.isGroupChat){
        return true;
    }

    return false;

}