import mongoose, { isValidObjectId } from "mongoose";
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
import { Chat } from "../models/chat.model.js";
import { getIO } from "../sockets/socketInstance.js";
import { socketEvents } from "../constants/socketEvents.js";
import { Message } from "../models/message.model.js";
import { summarizeChat } from "../services/ai.service.js";
import { summarizeChatService } from "../services/chat.services.js";


const isChatExists = asyncHandler(async (req, res) => {
    const { chatId } = req.params

    if (!isValidObjectId(chatId)) {
        throw new ApiError(400, "Invalid ChatId for New Chat.")
    }

    const isChatAlreadyExists = await Chat.findOne({
        _id: chatId,
        participants: { $in: [req.user._id] }
    })

    // console.log("Is Chat Already Exists :: ", isChatAlreadyExists);

    return res.status(200).json(
        new ApiResponse(200, {
            isChatExists: isChatAlreadyExists ? true : false,
            chat: isChatAlreadyExists
        }, `Chat ${isChatAlreadyExists ? "Exists" : "Does Not Exists"} Between These Users.`)
    )
})


const createSingleChat = asyncHandler(async (req, res) => {
    const { userId } = req.params


    if (!userId || userId && userId.trim() === "" || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid UserId for New Chat.")
    }

    const isChatAlreadyExists = await Chat.findOne({
        participants: { $all: [userId, req.user._id] },
        isGroupChat: false
    })

    if (isChatAlreadyExists) {
        throw new ApiError(400, "Chat Between These Users Already Exists.")
    }

    const newSingleChat = await Chat.create({
        participants: [
            userId,
            req.user._id
        ]
    })

    if (!newSingleChat) {
        throw new ApiError(500, "Server Error While Creating New Single Chat.")
    }

    let newChat = await newSingleChat.populate("participants", "-password")

    console.log("New Single Chat Created : ", newChat);



    return res.status(201).json(
        new ApiResponse(201, newChat, "New Single Chat Created Successfully.")
    )

})

const createGroupChat = asyncHandler(async (req, res) => {
    const {
        groupName,
        participants,
    } = req.body

    console.log("Create Group Chat Request Body :: ", req.body)

    if (!groupName || groupName && groupName.trim() === "") {
        throw new ApiError(400, "GroupName is Required.")
    }

    let groupData = {
        groupName,
        createdBy: req.user._id,
        isGroupChat: true,
        admins: [req.user._id],
        groupPicture: `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}&scale=90`,
    }

    if (participants && participants.length > 0) {
        let validParticipants = new Array()

        Array.from(participants).forEach((user) => {
            if (mongoose.Types.ObjectId.isValid(user)) {
                validParticipants.push(new mongoose.Types.ObjectId(user))
            }
        })

        if (validParticipants.length > 0) {
            groupData.participants = validParticipants
        }
    }

    if (!groupData.participants || groupData.participants.length === 0) {
        groupData.participants = [req.user._id]
    }
    else {
        groupData.participants.push(req.user._id)
    }

    const newGroup = await Chat.create(groupData)


    if (!newGroup) {
        throw new ApiError(500, "Server Error While Creating Group.")
    }

    const newIndicator = await Message.create({
        chatId: newGroup._id,
        message: `${req.user.username} create this group`,
        isIndicator: true,
        sender: req.user._id
    })

    console.log("New Group Created :::::::::::::::::::::: ", newGroup)
    console.log("New Indicator Message :: ", newIndicator)

    const io = getIO();

    if (io) {
        for (let user of newGroup.participants) {
            io.to(user.toString()).emit(socketEvents.GROUP_CREATED, newGroup)
        }
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, newGroup, "New Group Created")
        )


})

const getUserChats = asyncHandler(async (req, res) => {
    const userChats = await Chat.aggregate([
        {
            $match: {
                participants: { $in: [req.user._id] }
            }
        },
        {
            $addFields: {
                sortTime: {
                    $ifNull: ["$lastMessage.createdAt", "$createdAt"]
                }
            }
        },
        {
            $sort: {
                sortTime: -1
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "participants",
                foreignField: "_id",
                as: "participants",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            name: 1,
                            avtar: 1,
                            lastActive: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "messages",

                let: {
                    chatId: "$_id",
                    userId: new mongoose.Types.ObjectId(req.user._id)
                },

                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$chatId", "$$chatId"] },
                                    { $eq: ["$receiver", "$$userId"] },
                                    { $eq: ["$status", "sent"] }
                                ]
                            }
                        },

                    },
                    {
                        $count: "unreadCount"
                    }
                ],
                as: "unreadData"
            }
        },
        {
            $addFields: {
                unreadMessagesCount: {
                    $ifNull: [
                        { $arrayElemAt: ["$unreadData.unreadCount", 0] },
                        0
                    ]
                }
            }
        },

        {
            $project: {
                messages: 0,
                unreadData: 0
            }
        }
    ])

    // console.log("User Chats : ",userChats);

    if (!userChats.length) {
        return res.status(200).json(
            new ApiResponse(200, [], "No Chats Found.")
        )
    }

    return res.status(200).json(
        new ApiResponse(200, userChats, "User Chats Fetched Successfully.")
    )
})

const getChatById = asyncHandler(async (req, res) => {
    const { chatId } = req.params
    if (!isValidObjectId(chatId)) {
        throw new ApiError(400, "Invalid ChatId.")
    }

    const chat = await Chat.findById(chatId)
        .populate('participants', 'username name avtar lastActive')

    if (!chat) {
        throw new ApiError(404, "Chat not found.")
    }

    return res.status(200).json(
        new ApiResponse(200, chat, "Chat Fetched Successfully.")
    )
})

const getUserChatUsers = asyncHandler(async (req, res) => {
    const users = await Chat.aggregate([
        {
            $match: {
                participants: new mongoose.Types.ObjectId(req.user._id),
                isGroupChat: false
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "participants",
                foreignField: "_id",
                as: "users",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            name: 1,
                            avtar: 1,
                        }
                    },

                ]
            }
        },
        {
            $unwind: "$users"
        },
        {
            $match: {
                "users._id": {
                    $ne: new mongoose.Types.ObjectId(req.user._id)
                }
            }
        }
        ,
        {
            $replaceRoot: {
                newRoot: "$users"
            }
        }

    ])

    if (!users) {
        throw new ApiError(400, "no users")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, users, "Fetched Users Successfully.")
        )
})

const getUserChatUsersServer = async (userId) => {
    const users = await Chat.aggregate([
        {
            $match: {
                participants: new mongoose.Types.ObjectId(userId),
                isGroupChat: false
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "participants",
                foreignField: "_id",
                as: "users",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            name: 1,
                            avtar: 1,
                        }
                    },

                ]
            }
        },
        {
            $unwind: "$users"
        },
        {
            $match: {
                "users._id": {
                    $ne: new mongoose.Types.ObjectId(userId)
                }
            }
        }
        ,
        {
            $replaceRoot: {
                newRoot: "$users"
            }
        }

    ])

    if (!users) {
        return []
    }

    return users


}

const getSummarizedChat = asyncHandler(async (req, res) => {

    const { chatId } = req.params

    const summary = await summarizeChatService(chatId)

    return res.status(200).json(
        new ApiResponse(200, summary, "Chat Summarized Successfully.")
    )
})




export {
    createGroupChat,
    createSingleChat,
    getUserChats,
    isChatExists,
    getChatById,
    getUserChatUsers,
    getUserChatUsersServer,
    getSummarizedChat
}