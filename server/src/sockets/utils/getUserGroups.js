import { Chat } from "../../models/chat.model.js"
import { redis } from "../../redis/config.js"

/**
 * @description Utility for getting user's all Groups
 * @access User
 * @param userId
 * @returns Array of Group Ids
 */
export const getUserGroups = async(userId)=>{

    let groups=[]

    try {
        let cached = await redis.get(`user-groups-${userId}`)

        if(cached){

            groups = JSON.parse(cached)
            
            if(groups && groups.length > 0){
                return groups
            }
        }

        throw new Error("Check In DB.")
       
    } 
    catch (error) {

        groups = await Chat.aggregate([
        {
            $match:{
                isGroupChat:true,
                participants:{
                    $in:[userId]
                }
            }
        },
        {
            $project:{
                _id:1
            }
        }
    ])

    if(!groups ||  (groups && !groups.length)){
        groups = []
    }

    groups = groups.map(id => id.toString())


    await redis.set(`user-groups-${userId}`,JSON.stringify(groups))

    }
    
    return groups;
}