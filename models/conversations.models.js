
import mongoose from "mongoose";

const conversationsSchema = mongoose.Schema({
    participants: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }
    ],
    messages: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Message', 
            default: [],
        }
    ]
}, {timestamps: true})

export const Conversations = mongoose.model('Conversations', conversationsSchema)