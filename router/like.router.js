import { Router } from "express";
import { getLikes } from "../controlers/like.controllers.js"
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";

export const  likeRouter= Router();

likeRouter.get("/getlikes", verifyLogin, getLikes);