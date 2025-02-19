import mongoose from "mongoose";
const SettingsSchema = new mongoose.Schema({
    facebook : {
        type : String,
        unique: true,
    },
    instagram : {
        type : String,
        unique: true,
    },
    twitter : {
        type : String,
        unique: true,
    },
    quora : {
        type : String,
        unique: true,
    },
    youtube : {
        type: String, //square logo
        default:"Name"
    },
    flyube : {
        type: String,
    },
    companyName : {
        type: String,
    },
    slogan : {
        type: String,
    },
    playstore : {
        type: String,
    },
    iosStore : {
        type: String,
    },
    phoneNumber : {
        type: String,
    },
    footer : {
        type: String,
    },
    rectangleLogo : {
        type: String,
    },
    squareLogo : {
        type: String, //rectangle
    }
    
},
{
    timestamps: true
})

export const Settings = mongoose.model('Settings', SettingsSchema)