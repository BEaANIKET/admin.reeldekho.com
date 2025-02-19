import mongoose from "mongoose";


const notificationsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    seen: {
        type: Boolean,
        default: false
    },
    referenceId: {
        type: String,
    },
    user: {
        type: {
            _id: mongoose.Schema.Types.ObjectId | String,
            fullName: String,
            profilePicture: String,
        }
    }
}, { timestamps: true })


export const Notification = mongoose.model('Notification', notificationsSchema);