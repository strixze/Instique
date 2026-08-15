import { socketEvents } from "../../constants/socketEvents.js"
import { Message } from "../../models/message.model.js"
import { getUserSocket, socketsMap } from "../soketsMap.js"
import { Chat } from "../../models/chat.model.js"
// import { get } from "http"
import { getOtherChatUser } from "../utils/getOtherChatUser.js"
import mongoose, { isValidObjectId } from "mongoose"
import { isChatExists } from "../../utils/document existance check/chat.js"
import { isUserExists } from "../../utils/document existance check/user.js"
import { redis } from "../../redis/config.js"
import { getGroupMembers } from "../utils/getGroupMembers.js"
import { adminPermission } from "../middleware/adminPermission.middleware.js"


export const groupHandler =  (io,socket) =>{

    // socket.on(socketEvents.ADD_MEMBER_IN_GROUP, adminPermission(socket) , async ({groupId,userId})=>{   // Admin Protected 

    //     console.log("Executed:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::")
    //     const groupChat = await isChatExists(groupId)
    //     const newMember = await isUserExists(userId)

    //     if(!groupChat || !newMember){
    //         socket.to(socket.user._id).emit(socketEvents.ERROR, {
    //               type: "Adding Member Error",
    //               message: "Error While Adding Member In Group."
    //         })
    //         return
    //     }


    //     const isAlreadyInGroup = groupChat.participants.some(p => p.toString() === userId.toString())

    //     if(isAlreadyInGroup){
    //         socket.to(socket.user._id).emit(socketEvents.ERROR, {
    //              type: "Adding Member Error",
    //              message: "Member Already In Group."
    //         })
    //         return
    //     }

    //     const newIndicator = Message.create({
    //         chatId:groupId,
    //         sender:socket.user._id,
    //         message:`${socket.user.username} added ${newMember.username}`,
    //         isIndicator:true
    //     })

    //     groupChat.participants.push(new mongoose.Types.ObjectId(userId))

    //     await groupChat.save()

    //     const groupMenbers = await getGroupMembers(groupId)

    //     if(!groupMenbers || !getGroupMembers.length){
    //         socket.to(socket.user._id).emit(socketEvents.ERROR, {
    //              type: "Adding Member Error",
    //              message: "Error While Adding Member In Group."
    //         })
    //         return
    //     }

    //     for(let member of groupMenbers){
    //         socket.to(member._id.toString()).emit(socketEvents.NEW_MESSAGE , newIndicator)
    //     }

    // })

}