import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { Review } from "../models/review.models.js";

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

export const userReview = async (req, res) => {
    const { id } = req.query;
    const star = req.body.star;
    const message = req.body.message;
    const { _id } = req.user;
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

        const reviwedUser = await Review.create({
            reviewedId: id,
            reviewerId: _id,
            totalStars: star,
            reviewMessage: message,
        });

        console.log(reviwedUser);

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
            user: updateUser,
            reviwedId: reviwedUser
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong"
        })
    }
}

export const getUsersReviewedId = async (req, res) => {
    const { _id } = req.user
    try {
        const reviewedId = await Review.find({
            reviewerId: _id
        }).select('-_id -createdAt -updatedAt -reviewerId');

        if (!reviewedId) {
            return res.status(404).json({
                message: "User hasn't reviewed anyone!",
            })
        }

        return res.status(200).json({
            message: "Reviewed id retrived successfully.",
            reviewedId: reviewedId
        });

    } catch (error) {
        console.log(error.message || error)
        return res.status(500).json({
            message: "Something went wrong"
        })
    }
}

export const getSellerReviewerdId = async (req, res) => {
    const { id } = req.query
    try {

        if (!id) {
            return res.status(400).json({
                message: "Id is required!",
            });
        }

        const reviewerId = await Review.find({
            reviewedId: id
        }).select('-createdAt -updatedAt -reviewedId').populate('reviewerId', 'profilePicture fullName _id');

        if (!reviewerId) {
            return res.status(404).json({
                message: "There are no reviewer for this seller!",
            })
        }

        return res.status(200).json({
            message: "Reviewed id retrived successfully.",
            reviewerId: reviewerId
        });

    } catch (error) {
        console.log(error.message || error)
        return res.status(500).json({
            message: "Something went wrong"
        })
    }
}

export const setBlockUser = async (req, res) => {
    const id = req.body.id;
    const { _id } = req.user
    try {
        if (!id) {
            return res.status(400).json({ message: "User ID is required" })
        }

        const existingBlock = await User.findById(_id);

        if (!existingBlock) {
            return res.status(404).json({ message: "User not found" });
        }

        const Block = new Set(existingBlock.block.map(String));
        // console.log(Block)
        if (Block.has(id)) {
            return res.status(409).json({ message: 'user already blocked.' });
        }

        const updatedUser= await User.findByIdAndUpdate(
            { _id: _id },
            { $addToSet: { block: id } },
            { new: true }
        )

        await User.updateOne(
            { _id: id },
            { $addToSet: { blockedBy: _id } }
        )

        return res.status(201).json({
            message: "User successfully blocked!",
            user: updatedUser
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Something went wrong! please try again later.'
        });
    }
}

export const deleteBlock = async (req, res) => {
    const id = req.query.id;
    const { _id } = req.user;

    try {
        if (!id) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await User.findById(_id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.block.includes(id)) {
            return res.status(409).json({ message: 'Cannot unblock a user that is not blocked.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            _id,
            { $pull: { block: id } },
            { new: true }
        );

        const updatedBlockedUser = await User.findByIdAndUpdate(
            id,
            { $pull: { blockedBy: _id } },
            { new: true }
        );

        return res.status(200).json({ message: "User successfully unblocked.", user: updatedUser });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Something went wrong! Please try again later.'
        });
    }
};
