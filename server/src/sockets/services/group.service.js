import { Chat } from "../../models/chat.model.js"

/**
 * @description Service for getting User group IDS
 * @param {*} userId 
 * @access User
 * @method GET
 * @returns Array of Group IDs
 */
const getUserGroupsService = async (userId)=>{
    
    const groups = await Chat.aggregate([
        {
            $match:{
                participants:{
                    $in:[userId]
                },
                isGroupChat:true
            }
        },
        {
            $project:{
                _id:1
            }
        }
    ])

    return !groups.length ? [] : groups

}

export {
    getUserGroupsService
}