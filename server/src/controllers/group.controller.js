import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError, ApiResponse } from "../utils/apiUtils.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
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
import { validateAtleastOneField } from "../utils/fields validations/validateAtleastOneField.js";
import { isChatExists } from "../utils/document existance check/chat.js";
import { getUserChatUsers, getUserChatUsersServer } from "./chat.controller.js";
import { getUniqueMembers } from "../utils/getUniqueMembers.js";
import { addMembertoGroupService, deleteGroupService, leaveGroupService, markMemberAsAdminService, unmarkMemberAsAdminService } from "../services/group.service.js";


const getGroupMembers = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        throw new ApiError(400, "Invalid GroupId")
    }

    const groupMembers = await Chat.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "participants",
                foreignField: "_id",
                as: "participants",
                let: { admins: "$admins" },
                pipeline: [
                    {
                        $addFields: {
                            isAdmin: {
                                $cond: {
                                    if: {
                                        $in: ["$_id", "$$admins"]
                                    },
                                    then: true,
                                    else: false

                                }
                            }
                        }
                    }
                ]
            }
        },

    ])

    if (!groupMembers.length) {
        return res
            .status(200)
            .json(
                new ApiResponse(200, [req.user._id], "No Members Yet.")
            )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, groupMembers[0].participants, "Group Members Fetched Successfully.")
        )
})


const updateGroupChat = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { groupName, groupDescription } = req.body;

    if (!isValidObjectId(id)) {
        throw new ApiError(400, "Invalid GroupId")
    }

    if (!validateAtleastOneField([groupName, groupDescription])) {
        throw new ApiError(400, "At least one field is required")
    }

    let data = {}

    if (groupName) {
        data.groupName = groupName
    }
    if (groupDescription) {
        data.groupDescription = groupDescription
    }

    const updatedGroup = await Chat.findByIdAndUpdate(
        id,
        {
            $set: data
        },
        {
            new: true
        }
    )

    if (!updatedGroup) {
        throw new ApiError(500, "Server Error While Updating Group Details.")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedGroup, "Group Details Updated Successfully.")
    )

})

const uploadGroupPicture = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        throw new ApiError(400, "Invalid GroupId")
    }

    if (!req.file) {
        throw new ApiError(400, "Group Picture is required.")
    }

    console.log("File Path :: ", req.file)

    const uploadRes = await uploadFileOnCloudinary(req.file.path);

    // console.log("Cloudinary Upload Response :: ", uploadRes)

    if (!uploadRes) {
        throw new ApiError(500, "Error While Uploading Group Picture.")
    }

    const group = await Chat.findByIdAndUpdate(
        id,
        {
            $set: {
                groupPicture: uploadRes.secure_url
            }
        },
        {
            new: true
        }
    )

    if (!group) {
        throw new ApiError(500, "Server Error While Updating Group Picture.")
    }

    return res.status(200).json(
        new ApiResponse(200, group, "Group Picture Uploaded Successfully.")
    )
})

const getNonGroupMembers = asyncHandler(async (req, res) => {

    const groupId = req.params.id

    const group = await isChatExists(groupId)

    if (!group) {
        throw new ApiError(400, "Invalid GroupId.")
    }

    const arr = await getUserChatUsersServer(req.user._id)
    const chatUsers = arr.map(a => a._id)


    // console.log("Array ::::: ",arr)
    // console.log("Array ::::: ",chatUsers)

    const users1 = getUniqueMembers(chatUsers, group.participants.filter(u => u.toString() !== req.user._id.toString()))
    let u = users1.map(u1 => new mongoose.Types.ObjectId(u1))

    const users = await User.aggregate([
        {
            $match: {
                _id: {
                    $in: u
                }
            }
        }
    ])

    if (!users.length) {
        throw new ApiError(400, "no users")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, users, "Fetched Users Successfully.")
        )
})


/**
 * @description Adds member in group.
 * @method POST
 * @access Admin Only
 */
const addMemberToGroup = asyncHandler(async (req, res) => {

    const { groupId, memberId } = req.body

    const { newIndicator, groupMenbers, newMember } = await addMembertoGroupService(groupId, req.user, memberId)

    if (!groupMenbers || !newIndicator) {
        throw new ApiError(500, "Error While Adding Member to Group.")
    }

    const io = getIO()

    for (let member of groupMenbers) {
        io.to(member._id.toString()).emit(socketEvents.NEW_MESSAGE, newIndicator)
        io.to(member._id.toString()).emit(socketEvents.ADD_MEMBER_IN_GROUP, newMember)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, newIndicator, "Member Added To Group Successfully.")
        )
})


/**
 * @description Marks member as group admin
 * @method POST
 * @access Admin Only
 */
const markMemberAsAdmin = asyncHandler(async (req, res) => {

    const { groupId, memberId } = req.body

    const { group, newIndicator, groupMenbers } = await markMemberAsAdminService(groupId, memberId)

    const io = getIO()

    if (newIndicator) {
        for (let member of groupMenbers) {
            io.to(member._id.toString()).emit(socketEvents.NEW_MESSAGE, newIndicator)
            io.to(member._id.toString()).emit(socketEvents.MARK_MEMBER_AS_ADMIN, { memberId })
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {
                memberId,
                message: "User Marked as Admin"
            }, "Member Marked As Admin.")
        )

})


/**
 * @description Un-Marks member as group admin
 * @method POST
 * @access Admin Only
 */
const unmarkMemberAsAdmin = asyncHandler(async (req, res) => {

    const { groupId, memberId } = req.body

    const { group, newIndicator, groupMenbers } = await unmarkMemberAsAdminService(groupId, memberId)

    const io = getIO()

    if (newIndicator) {
        for (let member of groupMenbers) {
            io.to(member._id.toString()).emit(socketEvents.NEW_MESSAGE, newIndicator)
            io.to(member._id.toString()).emit(socketEvents.UNMARK_MEMBER_AS_ADMIN, { memberId })
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {
                memberId,
                message: "User Unmarked as Admin"
            }, "Member Unmarked As Admin.")
        )

})

const getGroupMedia = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        throw new ApiError(400, "Invalid GroupId")
    }

    const messages = await Message.find({
        chatId: id,
        deleteForEveryone: { $ne: true },
        deletedFor: { $nin: [req.user._id] }
    }).populate('sender', 'username name avtar').sort({ createdAt: -1 });

    const photos = [];
    const links = [];

    for (const msg of messages) {
        if (msg.attachments && msg.attachments.length > 0) {
            for (const att of msg.attachments) {
                photos.push({
                    url: att.secure_url,
                    public_id: att.public_id,
                    messageId: msg._id,
                    sender: msg.sender,
                    createdAt: msg.createdAt
                });
            }
        }

        if (msg.message) {
            const text = msg.message.toLowerCase();
            if (text.includes('https:') || text.includes('http:') ||
                text.includes('.com') || text.includes('.in') || text.includes('.dev')) {
                links.push({
                    url: msg.message,
                    messageId: msg._id,
                    sender: msg.sender,
                    createdAt: msg.createdAt
                });
            }
        }
    }

    return res.status(200).json(
        new ApiResponse(200, { photos, links }, "Group media fetched successfully.")
    )
})

const leaveGroup = asyncHandler(async (req, res) => {

    console.log("GROUP ID :: ", req.params.id)

    const group = await leaveGroupService(req.params.id, req.user._id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, group, "Leaved group.")
        )

})

const deleteGroup = asyncHandler(async (req, res) => {

    const group = await deleteGroupService(req.params.id, req.user._id)

    return res
        .status(200)
        .json(
            new ApiResponse(200, group, "Group deleted.")
        )

})

export {
    getGroupMembers,
    updateGroupChat,
    uploadGroupPicture,
    getNonGroupMembers,
    addMemberToGroup,
    markMemberAsAdmin,
    unmarkMemberAsAdmin,
    getGroupMedia,
    leaveGroup,
    deleteGroup
}