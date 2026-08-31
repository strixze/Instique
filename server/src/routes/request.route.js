import { Router } from "express"
import { userAuth } from "../middlewares/userAuth.middleware.js";
import {
    getUserRequests,
    sendFriendReuest,
    acceptFriendRequest,
    rejectFriendRequest
}
    from "../controllers/request.controller.js";

const router = Router()

router.route("/my").get(userAuth, getUserRequests)
router.route("/friend-request/:id").post(userAuth, sendFriendReuest)
router.route("/friend-request/accept/:id").get(userAuth, acceptFriendRequest)
router.route("/friend-request/reject/:id").get(userAuth, rejectFriendRequest)

export default router;