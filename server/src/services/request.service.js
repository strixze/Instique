import mongoose from "mongoose"
import { Message } from "../models/message.model.js"
import { User } from "../models/user.model.js"
import { isChatExists } from "../utils/document existance check/chat.js"
import { isMessageExists } from "../utils/document existance check/message.js"
import { isUserExists } from "../utils/document existance check/user.js"
import { summarizeChat } from "./ai.service.js"
import { getMessagesForSummary } from "./message.service.js"
import { ApiError } from "../utils/apiUtils.js"
import { Request } from "../models/request.model.js"
import { Notification } from "../models/notification.model.js"
import { createNotificationService } from "./notification.service.js"
import { isRequestExists } from "../utils/document existance check/request.js"
import { request } from "express"
import { createSingleChatService } from "./chat.services.js"
import { getIO } from "../sockets/socketInstance.js"
import { socketEvents } from "../constants/socketEvents.js"
import { ZodNullable } from "zod"

/**
 * @description Service For Creating New Friend Request
 * @access User
 * @param {ObjectId} friendId
 * @returns Request Object
 */
const createFriendRequest = async (userId, friendId) => {

    const friend = await isUserExists(friendId)
    const user = await isUserExists(userId)

    const existingRequest = await Request.findOne({
        sender: userId,
        receiver: friendId,
        type: "DIRECT_CHAT_REQUEST",
        $or: [
            {
                status: "pending"
            },
            {
                status: "accepted"
            }
        ]
    });

    if (existingRequest) {
        throw new ApiError(400, "Friend request already sent.");
    }


    const payload = {
        type: "DIRECT_CHAT_REQUEST",
        sender: userId,
        receiver: friendId,
        message: "new friend request",
    }

    const newRequest = await Request.create(payload)

    if (!newRequest) {
        throw new ApiError(501, "Internal Server Error.")
    }

    const notification = await createNotificationService(
        userId,
        userId,
        [new mongoose.Types.ObjectId(friendId)],
        "friend_request",
        newRequest._id,
        false,
        `${user.username} sent you friend request.`,
        ""
    )

    return newRequest;

}

/**
 * @description Service for fetching all pending requests of user
 * @access User
 * @param {ObjectId} userId 
 * @returns Array of Request Objects
 */
const getUserRequestsService = async (userId) => {

    const user = await isUserExists(userId)

    const requests = await Request.aggregate([
        {
            $match: {
                receiver: new mongoose.Types.ObjectId(user._id),
                status: "pending"
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    return requests

}

/**
 * @description Service for accepting friend request
 * @access User
 * @param {ObjectId} requestId 
 * @param {ObjectId} userId 
 * @returns Updated Request Object
 */
const acceptRequestService = async (requestId, userId) => {

    const request = await isRequestExists(requestId)

    const user = await isUserExists(userId)

    const io = getIO()

    if (request.receiver.toString() !== userId.toString()) {
        throw new ApiError(401, "Unauthorized User.")
    }

    const newChat = await createSingleChatService(request.receiver, request.sender);

    const notificationPayload = {
        sender: userId,
        receivers: [request.sender],
        type: "notify",
        content: `${user.username} accepted your friend request`,
        entityId: null,
        isGroupNotification: false,
        renderUrl: ""
    }

    console.log("NOTIFICATION ACCEPTED :: ", notificationPayload)

    const notification = await createNotificationService(userId,
        userId,
        notificationPayload.receivers, notificationPayload.type,
        notificationPayload.entityId,
        notificationPayload.isGroupNotification,
        notificationPayload.content,
        notificationPayload.renderUrl
    )

    if (notification) {

        const populatedNotification = await Notification.findById(notification._id).populate("sender", "username avtar")

        if (populatedNotification) {
            io.to(request.sender.toString()).emit(socketEvents.NEW_NOTIFICATION, populatedNotification)
        }

    }

    if (!newChat) {
        throw new ApiError(500, "Server Error While Creating New Chat.")
    }

    request.status = "accepted"

    await request.save({ validateBeforeSave: false })

    return request;

}

/**
 * @description Service for rejecting friend request
 * @access User
 * @param {ObjectId} requestId 
 * @param {ObjectId} userId 
 * @returns Updated Request Object
 */
const rejectRequestService = async (requestId, userId) => {

    const request = await isRequestExists(requestId)

    if (request.receiver.toString() !== userId.toString()) {
        throw new ApiError(401, "Unauthorized User.")
    }

    request.status = "rejected"

    await request.save({ validateBeforeSave: false })

    return request;

}

export {
    createFriendRequest,
    getUserRequestsService,
    acceptRequestService,
    rejectRequestService
}