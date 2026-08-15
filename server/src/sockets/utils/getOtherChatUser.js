import { Chat } from "../../models/chat.model.js"

export const getOtherChatUser = async (chatId,currentUserId) =>{      // This function returns User other that Currently LoggedIn user from Single Chat

    try {
        const chat = await Chat.findById(chatId)

        if(!chat){
            return null
        }

       const user = chat.participants.filter(user=>user.toString() !== currentUserId.toString())

        return user[0].toString()
    } catch (error) {
        return null
    }

}