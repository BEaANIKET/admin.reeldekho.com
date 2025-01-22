import mongoose from "mongoose";
import { Follow } from "../models/follow.models.js";
import { User } from "../models/user.models.js";

export const createFollower = async (req, res) => {

    const session = await mongoose.startSession();
    try {
        const { id } = req.query;
        const { _id } = req.user;

        if (!id && !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "The 'id' query is missing in the request or not valid!!",
            });
        }

        if (id == _id) {
            return res.status(400).json({
                message: "You cannot follow yourself.",
            });
        }

        const existingFollow = await Follow.findOne({
            followerId: _id,
            followedId: id,
        });

        if (existingFollow) {
            return res.status(400).json({
                message: "You are already following this user.",
            });
        }

        session.startTransaction();

        const newFollow = await Follow.create([{
            followerId: _id,
            followedId: id,
        }], { session });

        await User.findByIdAndUpdate(
            id,
            { $inc: { followers: 1 } }, // Increment the followers count
            { new: true, session } // Return the updated document
        );

        await User.findByIdAndUpdate(
            _id,
            { $inc: { following: 1 } }, // Increment the following count
            { new: true, session } // Return the updated document
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Follow relationship created successfully.",
            follow: newFollow,
        });

    } catch (error) {

        await session.abortTransaction();
        session.endSession();
        return res.status(500).json(
            {
                message: "Server error",
                error: error.message || "Cannot follow, please try again!!",
            }
        );
    }
};

export const removeFollower = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.query;
        const { _id } = req.user;

        // Validate the id parameter
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "The 'id' query is missing in the request or not valid!",
            });
        }

        // Check if trying to unfollow self
        if (id == _id) {
            return res.status(400).json({
                message: "You cannot unfollow yourself.",
            });
        }

        // Check if the follow relationship exists
        const existingFollow = await Follow.findOne({
            followerId: _id,
            followedId: id,
        });

        if (!existingFollow) {
            return res.status(400).json({
                message: "You are not following this user.",
            });
        }

        // Start transaction
        session.startTransaction();

        // Remove the follow relationship
        await Follow.findByIdAndDelete(existingFollow._id, { session });

        // Decrement the followers count for the followed user
        await User.findByIdAndUpdate(
            id,
            { $inc: { followers: -1 } }, // Decrement the followers count
            { new: true, session }
        );

        // Decrement the following count for the current user
        await User.findByIdAndUpdate(
            _id,
            { $inc: { following: -1 } }, // Decrement the following count
            { new: true, session }
        );

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            message: "Successfully unfollowed the user.",
        });

    } catch (error) {
        // Rollback transaction in case of error
        await session.abortTransaction();
        session.endSession();
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            error: error.message || "Cannot unfollow, please try again!",
        });
    }
};

export const getAllFollowed = async (req, res) => {
    const { _id } = req.user;

    try {
        const allFollowings = await Follow.find({ followerId: _id })
            .populate('followedId', 'fullName profilePicture');

        if (allFollowings.length === 0) {
            return res.status(200).json({
                message: "You are not following anyone.",
                following: [],
            });
        }

        return res.status(200).json({
            message: "Following successfully retrieved!",
            following: allFollowings,
        });

    } catch (error) {
        console.error('Error fetching followings:', error);

        return res.status(500).json({
            message: "Server error",
            error: error.message || "Could not fetch followings. Please try again!",
        });
    }
};

export const getAllFollowers = async (req, res) => {
    const { _id } = req.user; // Get the current user's ID from the request object

    try {
        // Find all followers of the current user
        const allFollowers = await Follow.find({ followedId: _id })
            .populate('followerId', 'fullName profilePicture'); // Populate follower details

        // If no followers are found, respond with a message
        if (allFollowers.length === 0) {
            return res.status(200).json({
                message: "No one is following you.",
                followers: [],
            });
        }

        // Respond with the list of followers
        return res.status(200).json({
            message: "Followers successfully retrieved!",
            followers: allFollowers,
        });

    } catch (error) {
        console.error('Error fetching followers:', error); // Log any errors

        // Respond with a server error message
        return res.status(500).json({
            message: "Server error",
            error: error.message || "Could not fetch followers. Please try again!",
        });
    }
};

