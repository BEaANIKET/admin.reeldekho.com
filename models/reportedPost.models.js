import mongoose from "mongoose"

const reportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    reportMessage: {
        type: String,
        required: true
    }
});

export const ReportedPost= mongoose.model('reportPosts',reportSchema)