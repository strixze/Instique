import { Chat } from "../models/chat.model.js"
import { Message } from "../models/message.model.js"
import { User } from "../models/user.model.js"
import { isChatExists } from "../utils/document existance check/chat.js"
import { isMessageExists } from "../utils/document existance check/message.js"
import { isUserExists } from "../utils/document existance check/user.js"
import { summarizeChat } from "./ai.service.js"
import { getMessagesForSummary } from "./message.service.js"

/**
 * @description Service for creating new single chat
 * @access User
 * @param {ObjectId} currentUserId 
 * @param {ObjectId} friendId 
 * @returns New Chat Object
 */
const createSingleChatService = async (currentUserId, friendId) => {

    const user = await isUserExists(currentUserId)
    const friend = await isUserExists(friendId)

    const isChatAlreadyExists = await Chat.findOne({
        participants: { $all: [user._id, friend._id] },
        isGroupChat: false
    })

    if (isChatAlreadyExists) {
        throw new ApiError(400, "Chat Between These Users Already Exists.")
    }

    const newSingleChat = await Chat.create({
        participants: [
            user._id,
            friend._id
        ]
    })

    if (!newSingleChat) {
        throw new ApiError(500, "Server Error While Creating New Single Chat.")
    }

    let newChat = await newSingleChat.populate("participants", "-password")

    console.log("New Single Chat Created : ", newChat);

    return newSingleChat;

}

/**
 * @description Service for summarizing chat conversations using AI
 * @param {ObjectId} chatId 
 * @returns Structured summary of the chat 
 */
const summarizeChatService = async (chatId) => {
    // Fetch recent messages for the chat
    const messages = await getMessagesForSummary(chatId, 30); // Get last 30 messages
    // Call the AI summarization function
    const summary = await summarizeChat(messages);
    return summary;
}

export {
    summarizeChatService,
    createSingleChatService
}