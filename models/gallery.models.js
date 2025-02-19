import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema({
    Title : {
        type : String,
        unique: true,
        required: true
    },
     user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
    image : {
        type: String,
        default:"Name"
    }, 
    About : {
        type: String,
    },
    Type : {
        type: String,
    }
},
{
    timestamps: true
})

export const Gallery = mongoose.model('Gallery', gallerySchema)