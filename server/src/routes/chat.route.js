import { Router } from "express";
import { userAuth } from "../middlewares/userAuth.middleware.js"
import {
createSingleChat,
getUserChats,
createGroupChat,
isChatExists,
getChatById,
getUserChatUsers,
getSummarizedChat
} from "../controllers/chat.controller.js";

const router = Router();

// router.route("/send").post();
// router.route("/receive").get();
router.route("/user").get(userAuth,getUserChatUsers)
router.route("/single/:userId").post(userAuth, createSingleChat)
router.route("/summary/:chatId").get(userAuth, getSummarizedChat)
router.route("/group").post(userAuth, createGroupChat)
router.route("/").get(userAuth, getUserChats)
router.route("/exists/:chatId").get(userAuth, isChatExists)
router.route("/:chatId").get(userAuth, getChatById)
export default router;  