import { Router } from "express";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";
import { createFollower, getAllFollowed, getAllFollowers, removeFollower } from "../controlers/follow.controllers.js";

export const followRouter= new Router();

followRouter.get('/getfollower', (req, res) => { res.json({message: 'hello world!'}); });

followRouter.post('/createFollower',verifyLogin ,createFollower);
followRouter.get('/getFollowed', verifyLogin, getAllFollowed);
followRouter.get('/getAllFollower', verifyLogin, getAllFollowers);
followRouter.delete('/unfollow', verifyLogin, removeFollower)