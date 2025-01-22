
import { Router } from "express";
import { getConversations, getMessages, info, sendMessage } from "../controlers/sendMessage.controllers.js";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";

const router = new Router();

router.get('/get', verifyLogin, getMessages)
router.post('/send', verifyLogin, sendMessage)
router.get('/getee', verifyLogin, getConversations)
router.get('/info', verifyLogin, info)

export default router