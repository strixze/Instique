import mongoose from "mongoose";
import dotenv from "dotenv"
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
dotenv.config({ path: "./.env" })

const messageSchema = new mongoose.Schema({

    chatId: {
        type: mongoose.Types.ObjectId,
        ref: "Chat",
        required: true
    },
    tempId: {
        type: String
    },
    sender: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },
    receiver: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        // required: true
    },
    message: {
        type: String,
        trim: true,
    },
    attachments: [
        {
            secure_url: {
                type: String
            },
            public_id: {
                type: String
            }
        }
    ],

    isReply: {
        type: Boolean,
        default: false
    },

    reply: {
        messageId: {
            type: mongoose.Types.ObjectId,
            ref: "Message"
        },
        message: {
            type: String,
            trim: true
        }
    },

    reactions: [
        {
            emoji: {
                type: String
            },
            user: {
                type: mongoose.Types.ObjectId,
                ref: "User"
            }
        }
    ],

    isIndicator: {
        type: Boolean,
        default: false
    },

    deleteForEveryone:{
        type:Boolean,
        default:false
    },

    deletedFor:[
        {
            type:mongoose.Types.ObjectId,
            ref:"User"
        }
    ],

    status: {
        type: String,
        enum: ["sent", "delivered", "seen"],
        default: "sent"
    },
    seenBy:[
        {
        type:mongoose.Types.ObjectId,
        ref:"User"
        }
    ],
    seenAt: {
        type: Date,
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

export const Message = mongoose.model("Message", messageSchema);