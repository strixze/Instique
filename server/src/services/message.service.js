import { Message } from "../models/message.model.js"
import { User } from "../models/user.model.js"
import { isChatExists } from "../utils/document existance check/chat.js"
import { isMessageExists } from "../utils/document existance check/message.js"
import { isUserExists } from "../utils/document existance check/user.js"
import mongoose from "mongoose"

/**
 * @description Service for getting Last chat message
 * @access User
 * @param {ObjectId} chatId 
 * @returns Message
 */
const getLastChatMessage = async (chatId) => {

    const chat = await isChatExists(chatId)

    const messages = await Message.aggregate([
        {
            $match: {
                chatId: chatId,
                deleteForEveryone:{
                    $ne:true
                }
            }
        },
        {
            $sort:{createdAt:-1}
        }
    ])

    return messages[0]

}

/**
 * @description Service for delete message for me
 * @param {ObjectId} messageId 
 * @param {ObjectId} userId 
 * @returns  message object
 */
const deleteForMeService = async(messageId,userId)=>{

    const message = await isMessageExists(messageId)
    const user = await isUserExists(userId)

    message.deletedFor.push(user._id)

    await message.save()

    return message
}

/**
 * @description Service for Delete message for everyone
 * @param {ObjectId} messageId 
 * @returns updated Message Object
 */
const deleteForEveryoneService = async(messageId)=>{
    
    const message = await isMessageExists(messageId)

    message.deleteForEveryone = true

    await message.save()

    return message
}

/**
 * @description Service for fetching members who have seen the message.
 * @param {ObjectId} messageId 
 * @returns Array of User Objects
 */
const getSeenMembersService = async(messageId)=>{

    const message = await isMessageExists(messageId)

    const seenByUserIds = message.seenBy

    const seenMembers = await User.aggregate([
        {
            $match:{
                _id:{
                    $in:seenByUserIds
                }
            }  
        },
        {
                $project:{
                    username:1,
                    name:1,
                    avtar:1
                }
            }
    ])



    if(!seenMembers.length){
        return []
    }

    return seenMembers
}

/**
 * @description Service for fetching messages for summary generation
 * @param {ObjectId} chatId 
 * @param {number} limit 
 * @returns Array of Message Objects
 */
const getMessagesForSummary = async (chatId, limit = 30) =>{
    const messages = await Message.aggregate([
        {
            $match: {
                chatId: new mongoose.Types.ObjectId(chatId),
                deleteForEveryone: {
                    $ne: true
                }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            name:1,
                            
                        }
                    }
                ]
            }
        }
    ]);

    console.log("Messages for summary = ", messages)

    return messages;

}

/**
 * @description Service for fetching conversation of group chat.
 * @access every group member
 * @param {ObjectId} groupId
 */
const getChatAttachmentsService = async (chatId) => {

    const chat = await isChatExists(chatId)

    const attachments = await Message.find({
        chatId,
        attachments: {
            $exists: true,
            $not: {$size: 0}
        },
        deleteForEveryone: {
            $ne: true
        }
        }).select("attachments -attachments.public_id")

        console.log("Attachments = ", attachments)

    return attachments;
  
}


export {
    deleteForMeService,
    deleteForEveryoneService,
    getLastChatMessage,
    getSeenMembersService,
    getMessagesForSummary  ,
    getChatAttachmentsService 
}