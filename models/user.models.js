import mongoose from "mongoose";
import { Follow } from "./follow.models.js";

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        // required: true
    },
    profilePicture: {
        type: String,
        default: 'https://static.vecteezy.com/system/resources/thumbnails/048/334/475/small_2x/a-person-icon-on-a-transparent-background-png.png'
    },
    occupation: {
        type: String,
        default: 'Shoes Seller'
    },
    website: {
        type: String,
        default: 'www.shoeseller.com'
    },
    address: {
        type: String,
        default: 'New York, USA'
    },
    role: {
        type: String,
        default: 'Member'
    },
    smallvideo: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    lattitude: {
        type: String,
    },
    longitude: {
        type: String,
    },
    followers: {
        type: Number,
        default: 0
    },
    following: {
        type: Number,
        default: 0
    },
    totalStars: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    googleMapLink: {
        type: String
    },
    googleId: {
        type: String,
        unique: true,
    },
    city: {
        type: String,
        // default: 'New York'
    },
    block: [ {type: mongoose.Schema.Types.ObjectId} ],
    blockedBy: [ {type: mongoose.Schema.Types.ObjectId} ],
}, { timestamps: true });


export const User = mongoose.model('User', UserSchema);
