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
import { getUserChatPartners } from "../sockets/utils/getUserChatPartners.js";
import { getIO } from "../sockets/socketInstance.js";
import { socketEvents } from "../constants/socketEvents.js";
import { getUserSocket } from "../sockets/soketsMap.js";
import { acceptRequestService, createFriendRequest, getUserRequestsService, rejectRequestService } from "../services/request.service.js";
import { createNotificationService } from "../services/notification.service.js";


/**
 * @description Controller to send new friend Request
 * @method POST
 * @access User
 * @param Id
 */
export const sendFriendReuest = asyncHandler(async (req, res) => {

    const friendId = req.params.id;

    const newRequest = await createFriendRequest(req.user._id, friendId)

    const io = getIO()


    io.to(friendId.toString()).emit(socketEvents.NEW_NOTIFICATION, newRequest)

    return res
        .status(201)
        .json(
            new ApiResponse(201, newRequest, "Friend Request Sent.")
        )

})

/**
 * @description Controller to Fetch all Pending user requests
 * @method GET
 * @access User
 * @param Id
 */
export const getUserRequests = asyncHandler(async (req, res) => {

    const requests = await getUserRequestsService(req.user._id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, requests, "All Requests Fetched Successfully.")
        )

})

/**
 * @description Controller for accepting friend request
 * @access User
 * @method GET
 * @param Id
 */
export const acceptFriendRequest = asyncHandler(async (req, res) => {

    const requestId = req.params.id;

    const acceptedRequest = await acceptRequestService(requestId, req.user._id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, acceptedRequest, "Request Accepted.")
        )

})

/**
 * @description Controller for rejecting friend request
 * @access User
 * @method GET
 * @param Id
 */
export const rejectFriendRequest = asyncHandler(async (req, res) => {

    const requestId = req.params.id;

    const rejectedRequest = await rejectRequestService(requestId, req.user._id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, rejectedRequest, "Request Rejected.")
        )

})

// export {
//     sendFriendReuest,
//     getUserRequests
// }