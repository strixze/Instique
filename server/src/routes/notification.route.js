import { Router } from "express"
import { userAuth } from "../middlewares/userAuth.middleware.js";
import {
    getAllUserNotifications,
    createNotification,
    markAllNotificationsAsRead
}
    from "../controllers/notification.controller.js";

const router = Router()


router.route("/my").get(userAuth, getAllUserNotifications)
router.route("/create").post(userAuth, createNotification)
router.route("/mark-all-read").post(userAuth, markAllNotificationsAsRead)

export default router;