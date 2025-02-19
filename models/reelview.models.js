import mongoose from "mongoose"

const reelviewSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
})


export const ReelView = mongoose.model("ReelView", reelviewSchema)