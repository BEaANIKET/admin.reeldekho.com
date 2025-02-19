import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
        city: {
            type: String 
        },
        photo: {
            type: String
        },
    
    }, { timestamps: true }
)


export const City = mongoose.model('City', citySchema)