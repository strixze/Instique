import { socketEvents } from "../../constants/socketEvents.js"
import { Message } from "../../models/message.model.js"
import { getUserSocket, socketsMap } from "../soketsMap.js"
import { Chat } from "../../models/chat.model.js"
// import { get } from "http"
import { getOtherChatUser } from "../utils/getOtherChatUser.js"
import { isValidObjectId } from "mongoose"
import { groupTypingService } from "../services/message.service.js"
import { isGroupChat } from "../utils/isGroupChat.js"
import { getGroupMembers } from "../utils/getGroupMembers.js"

export const messageHandler = (io, socket) => {

    socket.on(socketEvents.NEW_MESSAGE, async (data) => {

        console.log("Message  : ", data)
        console.log("Sockets Map : ", socketsMap)

        let newChat;

        if (!data.chatId) {     // no chatId means this is new chat so create new chat in database
            newChat = await Chat.create({
                participants: [data?.sender, socket.user._id],
            })

            if (!newChat) {  // error while creating new chat (emit error event)
                socket.emit(socketEvents.ERROR, {
                    type: "Message Sending Error",
                    message: "Error While Sending Message."
                })
            }
        }


        const newMessage = await Message.create({    // save message to database
            sender: socket.user._id,
            receiver: data.receiver,
            attachments: data.attachments,
            message: data.message,
            chatId: newChat?._id || data.chatId
        })


        if (!newMessage) {   // error while saving message to database means message sending failure
            socket.emit(socketEvents.ERROR, {
                type: "Message Sending Error",
                message: "Error While Sending Message."
            })
        }
        else {
            socket.to(getUserSocket(data.receiver)).emit(socketEvents.NEW_MESSAGE, newMessage)     // Sending Message to Other user in Chat

            console.log("Emitting Message to User (TEMPID) : ", data.tempId)
            io.to(socket.user._id.toString()).emit(socketEvents.MESSAGE_SENT_SINGLE_CHAT, {       // Notifying Sender About Message Status as Sent
                message: newMessage,
                chatId: newMessage.chatId,
                sentAt: newMessage.createdAt,
                tempId: data.tempId
            })

             if(!newChat && data.chatId){

            const updateChat = await Chat.findByIdAndUpdate(
            data?.chatId,
            {
                $set:{
                    lastMessage:newMessage,
                    
                }
            }
        )

        }

        }
    })

    socket.on(socketEvents.NEW_MESSAGE_GROUP, async (data) => {

        console.log("Message  : ", data)
        console.log("Sockets Map : ", socketsMap)


        if (!data.chatId) {     // no chatId means this is new chat so create new chat in database
          console.log("No Group Chat ID :: ")

          socket.emit(socketEvents.ERROR, {
            type: "Message Sending Error",
            message: "Group Chat ID is required for sending message in group."
        })

        return
        }


        const newMessage = await Message.create({    // save message to database
            sender: socket.user._id,
            receiver: data.receiver,
            attachments: data.attachments,
            message: data.message,
            chatId:  data.chatId
        })


        if (!newMessage) {   // error while saving message to database means message sending failure
            socket.emit(socketEvents.ERROR, {
                type: "Message Sending Error",
                message: "Error While Sending Message."
            })
        }
        else {
            const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username name avtar')

            console.log("Emitting Message to Group Chat : ", data.chatId.toString())
            // io.to(newMessage.chatId.toString()).emit(socketEvents.NEW_MESSAGE, newMessage)     // Sending Message to Other user in Chat

            const members = await getGroupMembers(data.chatId)

            for (let member of members){
                if(member.toString() !== socket.user._id.toString()){
                    socket.to(getUserSocket(member.toString())).emit(socketEvents.NEW_MESSAGE, populatedMessage)     // Sending Message to Other user in Chat
                }
            }

            console.log("Emitting Message to User (TEMPID) : ", data.tempId)
            io.to(socket.user._id.toString()).emit(socketEvents.MESSAGE_SENT_SINGLE_CHAT, {       // Notifying Sender About Message Status as Sent
                message: populatedMessage,
                chatId: populatedMessage.chatId,
                sentAt: populatedMessage.createdAt,
                tempId: data.tempId
            })       

            const updateChat = await Chat.findByIdAndUpdate(
            data?.chatId,
            {
                $set:{
                    lastMessage:populatedMessage,
                    
                }
            }
        )

        }
    })

    socket.on(socketEvents.TYPING, async (data) => {   // handling typing event
        console.log("Typing Data : ", data)
        console.log("Sockets Map : ", socketsMap)

        const chat = await Chat.findById(data.chatId)   // checking if chat exists
        const otherUser = chat.participants.filter(user => socket.user._id.toString() !== user.toString())    // get user to whome event is going to emit


        const payload = {       // creating payload for emitting to other user
            chatId: data.chatId,
            isTyping: data.isTyping,
            sender: socket.user._id
        }

        console.log("Emitting Typing Event to User : ", getUserSocket(otherUser.toString()))

        socket.to(getUserSocket(otherUser.toString())).emit(socketEvents.TYPING, payload)
    })

    socket.on(socketEvents.TYPING_GROUP, async(data)=>{     // handling typing event for group chat
        console.log("Typing Group Data : ", data)
        console.log("User in Group :: ",socket.user._id)

        const {members,user} = await groupTypingService(socket.user._id,data.chatId)

        if(!members.length || !user){
            return 
        }

        const payload = {user,
            chatId:data.chatId,
            isTyping:data.isTyping
        }

        members.forEach((member)=>{
            if(member.toString() !== socket.user._id.toString()){
                socket.to(getUserSocket(member.toString())).emit(socketEvents.TYPING_GROUP, payload)
                console.log("Emiting Group Typing to as ", user.username)
            }
        })
    })

    socket.on(socketEvents.MESSAGE_SEEN_SINGLE_CHAT, async (data) => {     // Handling message Seen for Single chat event
        const { messageId, chatId } = data

        console.log("Message Seen Event Data : ", data)

        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            {
                $set: {
                    status: "seen",
                    seenAt: Date.now()
                }
            },
            { new: true }
        )

        if (!updatedMessage) {
            socket.emit(socketEvents.MESSAGE_SEEN_ERROR, {

                message: "error in updating message status as seen"
            })
        }

        const otherUserId = await getOtherChatUser(chatId, socket.user._id)

        console.log("Other User Id : ", otherUserId)

        const payload = {
            chatId,
            status: "seen",
            messageId
        }

        socket.to(otherUserId).emit(socketEvents.MESSAGE_SEEN_SINGLE_CHAT, payload)

    })

    socket.on(socketEvents.MESSAGE_SEEN_GROUP_CHAT, async(data)=>{      // Handling message Seen for Group chat event
        const { messageId, chatId } = data

        console.log("Group Message Seen Event Data : ", data)

        if(!isGroupChat(chatId)){
            return
        }

        const message = await Message.findByIdAndUpdate(
            messageId,
            {
                $push:{
                    seenBy:socket.user._id
                },
                $set:{
                    status:"seen",
                    seenAt:Date.now()
                }
            },
            {
                new:true
            }
        )

          const payload = {
            chatId,
            status: "seen",
            messageId
        }

          socket.to(messageId.toString()).emit(socketEvents.MESSAGE_SEEN_SINGLE_CHAT, payload)
    })

    socket.on(socketEvents.MESSAGE_REPLY_SINGLE_CHAT, async (data) => {

        console.log("Message (Reply) : ", data)
        console.log("Sockets Map : ", socketsMap)

        let newChat;

        if (!data.chatId) {     // no chatId means this is new chat so create new chat in database
            newChat = await Chat.create({
                participants: [data?.sender, socket.user._id],
            })

            if (!newChat) {  // error while creating new chat (emit error event)
                socket.emit(socketEvents.ERROR, {
                    type: "Message Sending Error",
                    message: "Error While Sending Message."
                })
            }
        }

        const newMessage = await Message.create({    // save message to database
            sender: socket.user._id,
            receiver: data.receiver,
            attachments: data.attachments || [],
            message: data.message,
            isReply:true,
            reply:{
                messageId:data.replyTo._id,
                message:data.replyTo.message
            },
            chatId: newChat?._id || data.chatId
        })

        if (!newMessage) {   // error while saving message to database means message sending failure
            socket.to(getUserSocket(data.sender)).emit(socketEvents.ERROR, {
                type: "Message Sending Error",
                message: "Error While Sending Message."
            })
        }
        else {
            socket.to(getUserSocket(data.receiver)).emit(socketEvents.NEW_MESSAGE, newMessage)     // Sending Message to Other user in Chat

            console.log("Emitting Message to User (TEMPID) : ", data.tempId)
            io.to(socket.user._id.toString()).emit(socketEvents.MESSAGE_SENT_SINGLE_CHAT, {       // Notifying Sender About Message Status as Sent
                message: newMessage,
                chatId: newMessage.chatId,
                sentAt: newMessage.createdAt,
                tempId: data.tempId,
                isReply:true,
                reply:{
                    messageId:data.replyTo._id,
                    message:data.replyTo.message
                }
            })
        }
    })

    socket.on(socketEvents.REACT_MESSAGE_SINGLE_CHAT , async(data)=>{

        console.log("Message Reaction Data : ", data)
        
        if(!isValidObjectId(data.messageId)){
            socket.to(getUserSocket(socket.user._id)).emit(socketEvents.ERROR, {
                type: "Message Reaction Error",
                message: "Error While Reacting Message."
            })

            return
        }

        if(!data.emoji || data.emoji && data.emoji.trim() === ""){
            socket.to(getUserSocket(socket.user._id)).emit(socketEvents.ERROR, {
                type: "Message Reaction Error",
                message: "Emoji is Required to React."
            })

            return 
        }

        const reaction = await Message.findByIdAndUpdate(
            data.messageId,
            {
                $push:{
                    reactions:{
                        emoji:data.emoji,
                        user:socket.user._id
                    }
                }
            },
            {
                new:true
            }
        )

        console.log("Reaction After Update : ", reaction)

        if(!reaction){
             socket.to(getUserSocket(socket.user._id)).emit(socketEvents.ERROR, {
                type: "Message Reaction Error",
                message: "Error While Creating Reaction."
            })

            return 
        }

        const to = data.to === "sender" ? reaction.sender : reaction.receiver

        console.log("Sending Reaction to : ", getUserSocket(to.toString()))
        io.to(getUserSocket(to.toString())).emit(socketEvents.REACT_MESSAGE_SINGLE_CHAT, reaction)

    })
}

