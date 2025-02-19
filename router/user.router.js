
import { Router } from "express";
import { deleteBlock, getCurrentUser, getSellerReviewerdId, getUserForSideBar, getUsersReviewedId, setBlockUser, userReview } from "../controlers/user.controllers.js";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";

export const userRoute = new Router();

userRoute.get('/current', verifyLogin, getCurrentUser)
userRoute.get('/alluser', verifyLogin, getUserForSideBar)
userRoute.post('/review', verifyLogin, userReview)
userRoute.get('/userReview', verifyLogin, getUsersReviewedId)
userRoute.get('/sellerReview', getSellerReviewerdId)
userRoute.post('/blockUser', verifyLogin, setBlockUser);
userRoute.delete('/unblockUser', verifyLogin, deleteBlock);