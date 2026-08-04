import { User } from "../../models/user.model.js"
import { isUserExists } from "../../utils/document existance check/user.js"
import { getGroupMembers } from "../utils/getGroupMembers.js"

const groupTypingService = async(userId,chatId)=>{

    const user = await User.findById(userId)

    if(!user){
        return null
    }

    const members = await getGroupMembers(chatId)

    return {members,user}
}

export {
    groupTypingService
}