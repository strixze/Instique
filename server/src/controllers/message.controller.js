import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError, ApiResponse } from "../utils/apiUtils.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendVerificationToken } from "../services/sendVerificationToken.js";
import { generateTokens } from "../services/generateTokens.js";
import { deleteFileFromCloudinary, uploadFileOnCloudinary } from "../services/cloudinary.service.js";
import { generateOTP } from "../services/generateOTP.js";
import { sendEmail } from "../services/brevoMail.service.js";
import { Message } from "../models/message.model.js";
import { validObjectId } from "../utils/isValidObjectId.js";
import { assertRequiredFields } from "../utils/fields validations/assertRequiredFields.js";
import { deleteForEveryoneService, deleteForMeService, getSeenMembersService, getChatAttachmentsService } from "../services/message.service.js";
import { getIO } from "../sockets/socketInstance.js";
import { socketEvents } from "../constants/socketEvents.js";


/**
 * @description Controller for fetching conversation between two chat users.
 * @access single chat members
 * @method GET
 * @param id (other chat user id)
 */
const getConversation = asyncHandler(async (req,res)=>{
    const id = req?.user?._id || null
    const otherUserId = req?.params?.id || null

    if(!otherUserId){
        throw new ApiError(400,"Other User Id is Required.")
    }

    const limit = Math.min(parseInt(req.query.limit) || 40, 100)
    const before = req.query.before || null

    const filter = {
        $or:[
            { sender: id, receiver: otherUserId },
            { sender: otherUserId, receiver: id },
        ],
        deletedFor: { $nin: [req.user._id] },
        deleteForEveryone: { $ne: true }
    }

    if (before && mongoose.isValidObjectId(before)) {
        filter._id = { $lt: new mongoose.Types.ObjectId(before) }
    }

    // Fetch limit+1 to check if there are more messages
    const messages = await Message.find(filter)
        .sort({ _id: -1 })
        .limit(limit + 1)

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    // Reverse to chronological order (oldest first)
    messages.reverse()

    const nextCursor = hasMore && messages.length > 0 ? messages[0]._id : null

    return res
        .status(200)
        .json(
            new ApiResponse(200, { messages, hasMore, nextCursor }, "Messages Fetch Successfully.")
        )
    
})


/**
 * @description Controller for fetching conversation of group chat.
 * @access every group member
 * @method GET
 * @param id (Group Id)
 */
const getGroupConversation = asyncHandler(async (req,res)=>{
    const id = req?.user?._id || null
    const groupId = req?.params?.id || null

    if(!groupId){
        throw new ApiError(400,"Other User Id is Required.")
    }

    const limit = Math.min(parseInt(req.query.limit) || 40, 100)
    const before = req.query.before || null

    const filter = { chatId: groupId }

    if (before && mongoose.isValidObjectId(before)) {
        filter._id = { $lt: new mongoose.Types.ObjectId(before) }
    }

    const messages = await Message.find(filter)
        .populate('sender', 'username name avtar')
        .sort({ _id: -1 })
        .limit(limit + 1)

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    messages.reverse()

    const nextCursor = hasMore && messages.length > 0 ? messages[0]._id : null

    return res
        .status(200)
        .json(
            new ApiResponse(200, { messages, hasMore, nextCursor }, "Messages Fetch Successfully.")
        )
    
})


/**
 * @description Controller for upload image that being send in chat.
 * @access single chat members
 * @method POST
 * @param req.files (files uploaded via multer)
 */
const uploadImage = asyncHandler(async (req,res)=>{

    const images = req.files

    console.log("File For Upload :: ",images)

    if(!images.length){
        throw new ApiError(400,"Atleast 1 Image is Required")
    }

    let imgs = new Array()

    imgs = images ? await Promise.all(
        images.map(async (image)=>{
            const res = await uploadFileOnCloudinary(image.path)

            console.log("Response Upload :: ",res)

            return{
                secure_url:res.secure_url,
                public_id:res.public_id
            }
        })
    ) : []

    console.log("Uploaded Url :: ",imgs)

    if(!imgs.length){
        throw new ApiError(500,"Error While Uploading Error.")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,imgs,"Uploaded Successfully")
        )

})


/**
 * @description Controller for send reply in single chat.
 * @access single chat members
 * @method POST
 * @param messageId (for which sending reply)
 * @param chatId 
 * @param replyMessage (reply text)
 */
const replyToMessage = asyncHandler(async (req,res)=>{

    const {messageId,chatId,replyMessage} = req.body

    if(!validObjectId(messageId) || !validObjectId(chatId)){
        throw new ApiError(400,"Invalid MessageId.")
    }


    assertRequiredFields([replyMessage])

    const messageReply = await Message.create({
        message:replyMessage,
        chatId,
        sender: req.user?._id || ""
    })

    return res.status(201).json(
        new ApiResponse(201, messageReply, "Reply sent successfully.")
    )

})


/**
 * @description Controller for delete message for me.
 * @access single chat (owner)
 *         group chat (every member)
 * @method DELETE
 */
const deleteForMe = asyncHandler(async (req,res)=>{

    const messageId = req.params.id
    const userId = req.user._id

    const message = await deleteForMeService(messageId,userId)

    return res
        .status(200)
        .json(
            new ApiResponse(200,message,"Message Deleted For User Successfully.")
        )

    
})


/**
 * @description Controller for Delete message for everyone
 * @access message owner
 * @method DELETE
 * @param id (messageId)
 */
const deleteForEveryone = asyncHandler(async (req,res)=>{

    const messageId = req.params.id

    const message = await deleteForEveryoneService(messageId)

    return res
        .status(200)
        .json(
            new ApiResponse(200,message,"Message Deleted for Everyone Successfully.")
        )
})

/**
 * @description Controller for fetching members who have seen the message.
 * @access single chat (message sender and receiver)
 *         group chat (message sender and group members)
 * @method GET
 * @param id (messageId)
 */
const getSeenMembers = asyncHandler(async(req,res)=>{
    
    const messageId = req.params.id

    const seenMembers = await getSeenMembersService(messageId)

    return res
        .status(200)
        .json(
            new ApiResponse(200,seenMembers,"Seen Members Feteched Successfully.")
        )
})

const getChatAttachments = asyncHandler(async(req,res)=>{

    const chatId = req.params.id

    const attachments = await getChatAttachmentsService(chatId)
    
    return res
        .status(200)
        .json(
            new ApiResponse(200,attachments,"Attachments Feteched Successfully.")
        )
})  

export {
    getConversation,
    uploadImage,
    getGroupConversation,
    deleteForMe,
    deleteForEveryone,
    getSeenMembers,
    getChatAttachments,
}