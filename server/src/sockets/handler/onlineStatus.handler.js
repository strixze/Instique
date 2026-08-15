import { socketEvents } from "../../constants/socketEvents.js";
import { addUserSocket,removeUserSocket,getUserSocket } from "../soketsMap.js";
import { getUserChatPartners } from "../utils/getUserChatPartners.js";
import { redis } from "../../redis/config.js";
import { getUserGroupsService } from "../services/group.service.js";

export const onlineStatusHandler = async(io,socket)=>{

    socket.join(socket.user?._id.toString())     // joining socket/user to its personal room

    const groups = await getUserGroupsService(socket.user._id)

    for (let group of groups){
        socket.join(group.toString())
        console.log("User Joined Group : ", group)
    }

    console.log("User Joined Room : ", socket.user?._id.toString())
    console.log("User Groups : ", groups)

    addUserSocket(socket.user?._id.toString(),socket.id)  // maping socket.id with user id in memory

    let userChatPartners;

   try {
      userChatPartners = JSON.parse(await redis.get(`chat-participants-${socket.user._id}`))      // Checking In Redis cache if chat partners of user are already cached
   } catch (error) {
    console.log("Redis Error :: ", error.message)
   }

    if(!userChatPartners){      // if not cached then get from database and cache it
        userChatPartners = await getUserChatPartners(socket.user._id)   // getting all chat partners of user to notify them about online status
        await redis.set(`chat-participants-${socket.user._id}`,JSON.stringify(userChatPartners))
    }
        // console.log("User Chat Partners : ",userChatPartners)
    
    let onlineUsers=[];        // getting all online users to notify the newly online user about their online status

    if(userChatPartners){
        for (let partner of userChatPartners){
            if(getUserSocket(partner.toString())){
                io.to(partner.toString()).emit(socketEvents.USER_ONLINE,socket.user._id)
                // console.log("Emitted Online Status to : ",partner.toString())
                onlineUsers.push(partner.toString())
            }
        }
        io.to(socket.user._id.toString()).emit(socketEvents.ONLINE_USERS,onlineUsers)
    }


}