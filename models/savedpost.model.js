import mongoose from "mongoose";


const savedpostScheam = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    }
})



export const SavedPost = mongoose.model('SavedPost', savedpostScheam);