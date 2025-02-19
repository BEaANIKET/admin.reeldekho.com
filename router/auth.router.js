
import { Router } from "express";
import { authUsingGoogle, login, Logout, post, profile, profileFile, register, updateProfile } from "../controlers/auth.controllers.js";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import passport from '../config/passport.config.js'

const router = new Router();

router.post('/register', register)
router.post('/login', login)
router.post('/logout', verifyLogin, Logout)

router.get('/profile', verifyLogin, profile)
router.post('/updateprofile', verifyLogin, upload.single('profilePicture'), profileFile, updateProfile)
router.get('/post', verifyLogin, post)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/google/redirect', passport.authenticate('google', { session: false }), authUsingGoogle)

export default router; 