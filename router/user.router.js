
import { Router } from "express";
import { getCurrentUser, getUserForSideBar, postReview } from "../controlers/user.controllers.js";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";

export const userRoute = new Router();

userRoute.get('/current', verifyLogin, getCurrentUser)
userRoute.get('/alluser', verifyLogin, getUserForSideBar)
userRoute.post('/review', verifyLogin, postReview)


