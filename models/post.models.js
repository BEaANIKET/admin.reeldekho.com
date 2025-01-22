import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    file: {
        url: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            // required: true
        }
    },
    caption: {
        type: String
    },
    price: {
        type: Number
    },
    category: {
        type: String
    },
    location: {
        type: String
    },
    likes: {
        type: Number,
        default: 0
    },
    isBoosted: {
        status: { type: Boolean, default: false },
        boostPaymentId: { type: String, default: null }
    }

}, { timestamps: true })

export const Post = mongoose.model('Post', postSchema)
