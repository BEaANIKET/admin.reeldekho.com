import mongoose from "mongoose";

const followSchema= mongoose.Schema({
    followerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
    },
    followedId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true,
    },
}, { timestamp: true })

export const Follow =mongoose.model('Follow', followSchema);