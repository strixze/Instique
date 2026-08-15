import { socketEvents } from "../../constants/socketEvents.js"
import { User } from "../../models/user.model.js"
import { redis } from "../../redis/config.js"
import { removeUserSocket } from "../soketsMap.js"
import { getUserChatPartners } from "../utils/getUserChatPartners.js"

export const disconnectHandler = (io, socket) => {
    socket.on("disconnect", async () => {

        removeUserSocket(socket.user._id.toString())       // removing socket id of user from in memory map when user disconnects

        let chatParticipants = JSON.parse(await redis.get(`chat-participants-${socket.user._id}`))     // Checking In Redis Cache if Chat Participants are available

        if (!chatParticipants) {      // If not Available in Redis Cache Then fetch From DB
            chatParticipants = await getUserChatPartners(socket.user._id)   // getting all chat partners of user to notify them about online status
            await redis.set(`chat-participants-${socket.user._id}`, chatParticipants, {
                EX: 300
            })
        }

        if (chatParticipants) {     // Emitting User Offline Status to all chat participants

            for (let partner of chatParticipants) {
                io.to(partner.toString()).emit(socketEvents.USER_OFFLINE, socket.user._id)
                console.log("Emitted Offline Status to : ", partner.toString())
            }
        }

        const updateLastActive = await User.findByIdAndUpdate(
            socket.user._id,
            {
                $set: {
                    lastActive: Date.now()
                }
            }
        )


        console.log("User disconnected : ", socket.id)
    })
}