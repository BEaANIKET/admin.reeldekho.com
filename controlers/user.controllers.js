import mongoose from "mongoose";
import { User } from "../models/user.models.js";

export const getUserForSideBar = async (req, res) => {
    try {
        const allUser = await User.find({
            _id: { $ne: req.user._id }
        }).select("-password")

        if (!allUser) {
            res.status(400)
                .json({
                    message: 'No user found'
                })
        }

        res.status(200).json({
            users: allUser
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getCurrentUser = async (req, res) => {

    try {
        const user = req.user
        if (!user) {
            res.status(401)
                .json({
                    message: 'No user logged in'
                })
        }
        res.status(200).json({
            user: user
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

export const postReview = async (req, res) => {
    const { id } = req.query;
    const star = req.body.star;
    try {

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid request!"
            });
        }

        const findUser = await User.findById(id);

        if (!findUser) {
            return res.status(400).json({
                message: "User not found!"
            })
        }

        const updateUser = await User.findOneAndUpdate(
            { _id: findUser._id },
            {
                $inc: {
                    totalStars: star,
                    totalReviews: 1
                }
            },
            {
                new: true,
                upsert: false
            }
        );


        return res.status(201).json({
            message: "Review Posted Successfully",
            user: updateUser
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong"
        })
    }
}