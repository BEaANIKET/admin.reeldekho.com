import mongoose from "mongoose";

export const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);

        console.log("DB connection established");

    } catch (error) {
        console.log("Error connecting to DB:", error.message);
        process.exit(1);
    }
};
