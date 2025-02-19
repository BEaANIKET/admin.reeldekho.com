import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { app, server } from "./socket.js";
import { connectDb } from "./db/index.js";

dotenv.config();
const port = process.env.PORT || 8000;
const frontendurl = process.env.FRONTEND_URL;

// Initialize Express app

// Middleware
app.use(cors({
  origin: ['https://reeldekho.com', 'https://www.reeldekho.com', 'reeldekho.com', 'http://localhost:5173'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.get("/", (req, res, next) => {
  console.log(req.params.path);
  next()
});

// Example route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Import routers
import authRouter from "./router/auth.router.js";
import messageRouter from "./router/message.router.js";
import { userRoute } from "./router/user.router.js";
import postRouter from "./router/post.router.js";
import { followRouter } from "./router/follow.router.js";
import notificationsRouter from "./router/notifications.router.js";
import { likeRouter } from "./router/like.router.js";

// Setup routes
app.use("/auth", authRouter);
app.use("/message", messageRouter);
app.use("/user", userRoute);
app.use("/post", postRouter);
app.use("/follow", followRouter);
app.use('/notification', notificationsRouter)
app.use('/like', likeRouter);

// Start server and connect to DB
server.listen(port, () => {
  connectDb(); // Connect to the database
  console.log(`Server is running on http://localhost:${port}`);
});
