import mongoose from "mongoose"

export const validObjectId = (id)=>{

    if(!id || (id && id.trim() === "")){
        return false
    }

    return mongoose.Types.ObjectId.isValid(id)

}