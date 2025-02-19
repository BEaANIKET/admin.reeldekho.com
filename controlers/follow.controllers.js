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

const getFollowedWithAggregation = async (sanitizedId, currentUserId) => {
  return await Follow.aggregate([
    { $match: { followerId: new mongoose.Types.ObjectId(sanitizedId) } }, // Get users followed by the current browsing user
    {
      $lookup: {
        from: "users", // Join with the Users collection
        localField: "followedId",
        foreignField: "_id",
        as: "followedDetails",
      },
    },
    { $unwind: "$followedDetails" }, // Unwind the followed user details
    {
      $lookup: {
        from: "follows", // Check if the current user follows these followed users
        let: { followedId: "$followedId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$followedId", "$$followedId"] }, // Check if the followed user matches
                  { $eq: ["$followerId", currentUserId] }, // Ensure it's the current user following
                ],
              },
            },
          },
        ],
        as: "isFollowedByMe",
      },
    },
    {
      $lookup: {
        from: "follows", // Check if the followed user is following the current user
        let: { followedId: "$followedId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$followerId", "$$followedId"] }, // Check if the followed user follows the current user
                  { $eq: ["$followedId", currentUserId] }, // Ensure the user being followed is the current user
                ],
              },
            },
          },
        ],
        as: "isFollowingMe",
      },
    },
    {
      $addFields: {
        isFollowedByMe: { $gt: [{ $size: "$isFollowedByMe" }, 0] }, // Boolean: true if the current user follows the followed user
        isFollowingMe: { $gt: [{ $size: "$isFollowingMe" }, 0] }, // Boolean: true if the followed user follows the current user
      },
    },
    {
      $project: {
        "followedDetails.fullName": 1,
        "followedDetails.profilePicture": 1,
        "followedDetails.occupation": 1,
        "followedDetails._id": 1,
        isFollowedByMe: 1,
        isFollowingMe: 1,
      },
    },
  ]);
};

const getFollowedWithFind = async (currentUserId) => {
  return await Follow.find({ followerId: currentUserId }).populate(
    "followedId",
    "fullName profilePicture occupation"
  );
};

export const getAllFollowed = async (req, res) => {
  const queryId = req.query.id;
  const sanitizedId = queryId === "undefined" ? undefined : queryId;
  const currentUserId = req.user._id;

  try {
    let followed;

    if (sanitizedId) {
      followed = await getFollowedWithAggregation(sanitizedId, currentUserId);
    } else {
      followed = await getFollowedWithFind(currentUserId);
    }

    if (!followed || followed.length === 0) {
      return res.status(200).json({
        message: "You are not following anyone.",
        following: [],
      });
    }

    return res.status(200).json({
      message: "Followed users successfully retrieved!",
      following: followed,
    });
  } catch (error) {
    console.error("Error fetching followed data:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message || "Could not fetch followed data. Please try again!",
    });
  }
};

const getFollowersWithAggregation = async (sanitizedId, currentUserId) => {
  return await Follow.aggregate([
    { $match: { followedId: new mongoose.Types.ObjectId(sanitizedId) } }, // Get followers of the user being browsed
    {
      $lookup: {
        from: 'users', // Join with the Users collection
        localField: 'followerId',
        foreignField: '_id',
        as: 'followerDetails',
      },
    },
    { $unwind: '$followerDetails' }, // Unwind the user details
    {
      $lookup: {
        from: 'follows', // Check if current user follows these followers
        let: { followerId: '$followerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$followedId', '$$followerId'] }, // Check if the follower is followed by the current user
                  { $eq: ['$followerId', currentUserId] }, // Ensure it's the current user following
                ],
              },
            },
          },
        ],
        as: 'isFollowedByMe',
      },
    },
    {
      $lookup: {
        from: 'follows', // Check if the follower is following the current user
        let: { followerId: '$followerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$followerId', '$$followerId'] }, // Check if the follower follows the current user
                  { $eq: ['$followedId', currentUserId] }, // Ensure the user being followed is the current user
                ],
              },
            },
          },
        ],
        as: 'isFollowingMe',
      },
    },
    {
      $addFields: {
        isFollowedByMe: { $gt: [{ $size: '$isFollowedByMe' }, 0] }, // Boolean: true if current user follows the follower
        isFollowingMe: { $gt: [{ $size: '$isFollowingMe' }, 0] }, // Boolean: true if the follower follows the current user
      },
    },
    {
      $project: {
        'followerDetails.fullName': 1,
        'followerDetails.profilePicture': 1,
        'followerDetails.occupation': 1,
        'followerDetails._id': 1,
        isFollowedByMe: 1,
        isFollowingMe: 1,
      },
    },
  ]);

};

const getFollowersWithFind = async (currentUserId) => {
  return await Follow.find({ followedId: currentUserId }).populate(
    'followerId',
    'fullName profilePicture occupation'
  );
};

export const getAllFollowers = async (req, res) => {
  const queryId = req.query.id;
  const sanitizedId = queryId === 'undefined' ? undefined : queryId;
  const currentUserId = req.user._id;
  try {
    let followers;

    if (sanitizedId) {
      followers = await getFollowersWithAggregation(sanitizedId, currentUserId);
    } else {
      followers = await getFollowersWithFind(currentUserId);
    }

    if (!followers || followers.length === 0) {
      return res.status(200).json({
        message: "No one is following you.",
        followers: [],
      });
    }

    return res.status(200).json({
      message: "Followers successfully retrieved!",
      followers,
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({
      message: "Server error",
      error: error.message || "Could not fetch followers. Please try again!",
    });
  }
};