
import mongoose from "mongoose"
import { Request } from "../../models/request.model.js"

export const isRequestExists = async (requestId) => {

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        throw new ApiError(400, "Invalid requestId")
    }

    const request = await Request.findById(requestId)

    if (!request) {
        throw new ApiError(404, "Request not found")
    }

    return request
}