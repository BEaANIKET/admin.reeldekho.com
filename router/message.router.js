
import { Router } from "express";
import { getConversations, getMessages, info, markUnSeenMsg, sendMessage } from "../controlers/sendMessage.controllers.js";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = new Router();

router.get('/get', verifyLogin, getMessages)
router.post('/send', verifyLogin, upload.single('file'), sendMessage)
router.get('/getee', verifyLogin, getConversations)
router.get('/info', verifyLogin, info)
router.post('/setunseenmsg', verifyLogin, markUnSeenMsg)

export default router