import { Router } from "express";
import {userAuth} from "../middlewares/userAuth.middleware.js"
import {
     getConversation,
     uploadImage,
     deleteForMe,
     deleteForEveryone,
     getSeenMembers,
          getChatAttachments
     } from "../controllers/message.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// router.route("/send").post();
// router.route("/receive").get();
router.route("/convo/:id").get(userAuth,getConversation)

router.route("/for-me/:id").delete(userAuth,deleteForMe)
router.route("/for-everyone/:id").delete(userAuth,deleteForEveryone)
router.route("/seen-by/:id").get(userAuth,getSeenMembers)
router.route("/upload-images").post(userAuth, upload.array("images",5) , uploadImage)
router.route("/attachments/:id").get(userAuth,getChatAttachments)
export default router;