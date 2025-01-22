import mongoose from "mongoose";


const likeSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    userId: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    totalLikesCount: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });


export const Likes = mongoose.model('Likes', likeSchema);