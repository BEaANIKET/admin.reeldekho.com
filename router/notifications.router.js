import { Router } from "express";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";
import { getNotifications, markNotificationAsRead } from "../controlers/notifications.controllers.js";
import { markUnSeenMsg } from "../controlers/sendMessage.controllers.js";

const router = Router()

router.get('/get', verifyLogin, getNotifications)
router.post('/seen', verifyLogin, markNotificationAsRead)

export default router