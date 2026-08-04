import { Router } from "express";
import { userAuth } from "../middlewares/userAuth.middleware.js";
import {
   getGroupMembers,
   updateGroupChat,
   uploadGroupPicture,
   getNonGroupMembers,
   addMemberToGroup,
   markMemberAsAdmin,
   unmarkMemberAsAdmin,
   getGroupMedia,
   leaveGroup,
   deleteGroup

} from "../controllers/group.controller.js";
import { getGroupConversation } from "../controllers/message.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { adminPermission } from "../middlewares/adminPermission.middleware.js";

const router = Router();

router.route("/add-member").post(userAuth, adminPermission, addMemberToGroup)
router.route("/mark-admin").post(userAuth, adminPermission, markMemberAsAdmin)
router.route("/unmark-admin").post(userAuth, adminPermission, unmarkMemberAsAdmin)
router.route("/delete/:id").delete(userAuth, adminPermission, deleteGroup)
router.route("/convo/:id").get(userAuth, getGroupConversation)
router.route("/non-group-members/:id").get(userAuth, getNonGroupMembers)
router.route("/upload-picture/:id").post(userAuth, upload.single("groupPicture"), uploadGroupPicture)
router.route("/members/:id").get(userAuth, getGroupMembers)
router.route("/update/:id").put(userAuth, updateGroupChat)
router.route("/media/:id").get(userAuth, getGroupMedia)
router.route("/leave/:id").get(userAuth, leaveGroup)

export default router;