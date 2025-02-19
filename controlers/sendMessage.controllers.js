import mongoose from "mongoose";
import { Conversations } from "../models/conversations.models.js";
import { Message } from "../models/message.models.js";
import { User } from "../models/user.models.js";
import { getUserSocketId, io } from "../socket.js";
import cloudinary from "../config/cloudinaryConfig.js";
import fs from 'fs'

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const receiverId = req.query?.id;
    const senderId = req.user._id;

    if (!receiverId || !senderId) {
      return res.status(400).json({
        message: "Missing required parameters: message, receiverId, senderId",
      });
    }

    let url = null;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'o2office',
          resource_type: "auto",
          transformation: [
            { width: 500, crop: "scale" },
            { quality: 'auto' },
            { fetch_format: "auto" }
          ]
        });
        url = result.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Error uploading file to Cloudinary:", uploadError);
        return res.status(500).json({
          message: "Error uploading file",
        });
      }
    }

    let conversations = await Conversations.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversations) {
      conversations = await Conversations.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
      file: url,
    });

    conversations.messages.push(newMessage._id);
    await conversations.save();

    const userSocketId = getUserSocketId(receiverId);
    if (io && userSocketId) {
      io.to(userSocketId).emit('newMessage', {
        _id: newMessage._id,
        senderId,
        receiverId,
        message,
        seen: false,
        file: newMessage?.file,
        isOwn: false,
        createdAt: newMessage.createdAt,
      });
    }

    return res.status(200).json({
      message: "Message sent successfully",
      chat: {
        id: newMessage._id,
        senderId,
        receiverId,
        message,
        seen: false,
        isOwn: true,
        file: newMessage?.file,
        createdAt: newMessage.createdAt,
      }
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    if (!req.query?.id || !req?.user?._id) {
      return res.status(400).json({
        message: "Missing required parameters: id",
      });
    }

    const userId = new mongoose.Types.ObjectId(req.query?.id);
    const senderId = new mongoose.Types.ObjectId(req.user?._id);

    const conversations = await Conversations.aggregate([
      {
        $match: {
          participants: { $all: [senderId, userId] },
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "messages",
          foreignField: "_id",
          as: "messages",
        },
      },
      {
        $unwind: "$messages",
      },
      {
        $addFields: {
          "messages.isOwn": {
            $cond: {
              if: { $eq: ["$messages.senderId", senderId] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          messages: {
            $push: {
              _id: "$messages._id",
              senderId: "$messages.senderId",
              receiverId: "$messages.receiverId",
              isOwn: "$messages.isOwn",
              message: "$messages.message",
              createdAt: "$messages.createdAt",
              updatedAt: "$messages.updatedAt",
              seen: "$messages.seen",
              file: "$messages.file"
            },
          },
          unseenCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$messages.seen", false] },
                    { $ne: ["$messages.senderId", senderId] },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
      {
        $sort: { "messages.createdAt": -1 },
      },
    ]);

    if (!conversations || conversations.length === 0) {
      return res.status(404).json({
        message: "No conversations found",
      });
    }

    return res.status(200).json({
      conversation: conversations[0],
      unseenCount: conversations[0].unseenCount,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      message: "Internal server error",
    });
  }
};


export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversations.aggregate([
      {
        $match: {
          participants: userId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participantDetails",
        },
      },
      {
        $project: {
          _id: 0,
          participants: {
            $filter: {
              input: "$participantDetails",
              as: "participant",
              cond: { $ne: ["$$participant._id", userId] },
            },
          },
        },
      },
      {
        $unwind: "$participants",
      },
      {
        $project: {
          _id: "$participants._id",
          fullName: "$participants.fullName",
          email: "$participants.email",
          profilePicture: "$participants.profilePicture",
        },
      },
    ]);

    return res.status(200).json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({
      error: error.message,
      message: "Internal server error",
    });
  }
};



export const info = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        _id: user._id,
        profilePicture: user.profilePicture,
        fullName: user.fullName,
      }
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const markUnSeenMsg = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await Message.updateMany(
      { senderId: id, receiverId: req.user._id },
      { $set: { seen: true } }
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'Unseen message count updated successfully' });
  } catch (error) {
    console.error('Error marking unseen messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}