import mongoose, { mongo, Schema } from "mongoose";

const requestSchema = new Schema({

    type: {
        type: String,
        enum: [
            "DIRECT_CHAT_REQUEST",
            "GROUP_INVITE",
            "GROUP_JOIN_REQUEST"
        ],
    },
    entityId: {
        type: mongoose.Types.ObjectId,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    message: {
        type: String,
    },
    processedAt: {
        type: Date,
        default: Date.now()
    },
    sender: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    receiver: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isRead: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })

requestSchema.index(
    { sender: 1, receiver: 1, type: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: "pending" } }
)
export const Request = mongoose.model("Request", requestSchema)