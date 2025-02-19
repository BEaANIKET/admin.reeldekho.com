import cloudinary from "../config/cloudinaryConfig.js";
import { Likes } from "../models/like.models.js";
import { Post } from "../models/post.models.js";
import { City } from "../models/city.js";
import { User } from "../models/user.models.js";
import { Gallery } from "../models/gallery.models.js";
import { Settings } from "../models/settings.js";
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { Comment } from "../models/comments.models.js";
import mongoose from "mongoose";
import { SavedPost } from "../models/savedpost.model.js";
import { razorpayInstance } from '../config/razorpayConfig.js'
import crypto from 'crypto'
import { ReportedPost } from "../models/reportedPost.models.js";
import { Notification } from "../models/notifications.js";
import { getUserSocketId, io } from "../socket.js";
import { ReelView } from "../models/reelview.models.js";
import { configDotenv } from "dotenv";

configDotenv();

// Add Post
export const addPost = async (req, res) => {
    try {
        const { title, description, file, caption, price, category, location } = req.body;
        const post = new Post({
            title,
            description,
            file,
            caption,
            price,
            category,
            location,
            userId: req.user._id,
            location: req.user?.city
        });

        await post.save();
        return res.status(201).json({
            message: "Post created successfully",
            post,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

export const getsearchresult = async (req, res) => {
    try {
        const search = req.query?.search || "";
        const city = req.query?.city || "";
        const limit = parseInt(req.query.limit, 10) || 10;

        if (isNaN(limit) || limit <= 0) {
            return res.status(400).json({ message: "Invalid limit value. Must be a positive number." });
        }

        const matchQuery = {};
        if (search) {
            matchQuery.caption = { $regex: search, $options: "i" };
        }
        if (city) {
            matchQuery.location = { $regex: city, $options: "i" };
        }

        let excludeIds = [];
        if (req.query.excludeIds) {
            try {
                excludeIds = req.query.excludeIds.split(",").map((id) => new mongoose.Types.ObjectId(id));
            } catch (error) {
                console.error("Invalid excludeIds format:", error);
                return res.status(400).json({ message: "Invalid excludeIds format." });
            }
        }

        matchQuery._id = { $nin: excludeIds };

        const randomPosts = await Post.aggregate([
            { $match: matchQuery },
            { $sample: { size: limit } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $project: {
                    "user.password": 0,
                    "user.email": 0,
                    "user.createdAt": 0,
                    "user.updatedAt": 0,
                    "user.backgroundCover": 0,
                    "user.occupation": 0,
                    "user.profilePicture": 0,
                    "user.website": 0,
                },
            },
        ]);

        if (!randomPosts.length) {
            return res.status(404).json({ message: "No posts found matching the criteria." });
        }

        return res.status(200).json(randomPosts);
    } catch (error) {
        console.error("Error fetching random posts:", error);
        return res.status(500).json({ message: "An error occurred while fetching posts." });
    }
};

// export const getsearchresult = async (req, res) => {
//     try {
//         const search = req.query?.search || '';
//         const city = req.query?.city || '';

//         const matchQuery = {};
//         if (search) {
//             matchQuery.caption = { $regex: search, $options: 'i' };
//         }
//         if (city) {
//             matchQuery.location = { $regex: city, $options: 'i' };
//         }

//         const randomPosts = await Post.aggregate([
//             {
//                 $match: matchQuery,
//             },
//             {
//                 $sample: { size: 12 },
//             },
//             {
//                 $lookup: {
//                     from: "users",
//                     localField: "userId",
//                     foreignField: "_id",
//                     as: "user",
//                 },
//             },
//             {
//                 $unwind: "$user",
//             },
//             {
//                 $project: {
//                     "user.password": 0,
//                     "user.email": 0,
//                     "user.createdAt": 0,
//                     "user.updatedAt": 0,
//                     "user.backgroundCover": 0,
//                     "user.occupation": 0,
//                     "user.profilePicture": 0,
//                     "user.website": 0,
//                 },
//             }
//         ]);



//         return res.status(200).json(randomPosts);
//     } catch (error) {
//         console.error("Error fetching random posts:", error);
//         return res.status(500).json({ message: "An error occurred while fetching posts." });
//     }
// };


export const fetchheader = async (req, res) => {
    try {
        const value = await Gallery.find({ Type: 'add pages' }).select('_id Title');
        const settin = await Settings.findOne()
        const data = { value, settin }
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching", error);
        return res.status(500).json({ message: "An error occurred while fetching pages." });
    }
};

export const fetchfaq = async (req, res) => {
    try {
        const value = await Gallery.find({ Type: 'add blogs' }).select('_id Title About createdAt');
        return res.status(200).json(value);
    } catch (error) {
        console.error("Error fetching", error);
        return res.status(500).json({ message: "An error occurred while fetching pages." });
    }
};

export const fetchpagenow = async (req, res) => {
    const { id: title } = req.params;
    try {
        const value = await Gallery.findOne({ Type: 'add pages', Title: title });
        if (!value) {
            return res.status(404).json({ message: "Page not found" });
        }
        return res.status(200).json(value);
    } catch (error) {
        console.error("Error fetching page:", error);
        return res.status(500).json({ message: "An error occurred while fetching the page." });
    }
};


export const updatePost = async (req, res) => {
    try {
        const { id } = req.query;
        const { data } = req.body;


        const post = await Post.findByIdAndUpdate(id, {
            ...data
        }, { new: true });

        if (!post) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        return res.status(200).json({
            message: "Post updated successfully",
            post,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

// Delete Post
export const deletePost = async (req, res) => {
    try {
        const { id } = req.query;

        const post = await Post.findByIdAndDelete(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        return res.status(200).json({
            message: "Post deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

export const getPosts = async (req, res) => {
    try {
        // Limit parameter to control number of posts fetched
        const limit = parseInt(req.query.limit, 10) || 3;
        const city = req.query?.city || '';

        const excludeIds = req.query.excludeIds
            ? req.query.excludeIds.split(',').map(id => new mongoose.Types.ObjectId(id))
            : [];

        let user_Id=null;
        if(req?.headers?.authorization){
            const token= req.headers.authorization.split(" ");
            try{
                const decodedToken = jwt.verify(token[1], process.env.JWT_SECRET);
                user_Id= decodedToken;
            }catch(error){
                console.log(error);
            }
        }

        const report= user_Id ? await ReportedPost.find({ userId: user_Id }) : null
        // console.log(report);

        report && report.map((reportedPost) => {
            excludeIds.push(reportedPost.postId)
        })


        const matchCriteria = {
            _id: { $nin: excludeIds },
        };


        if (city && city !== '' && city !== 'null' && city !== 'undefined') {
            matchCriteria['location'] = { $regex: city, $options: 'i' };
        }

        // Fetch posts, excluding the ones in excludeIds and ensuring they are unique
        const posts = await Post.aggregate([
            {
                $match: matchCriteria,
            },
            {
                $sample: { size: limit }, // Randomly sample the required number of posts
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user", // Flatten user data
            },
            {
                $project: {
                    "user.password": 0, // Exclude sensitive fields
                    "user.email": 0,
                    "user.createdAt": 0,
                    "user.updatedAt": 0,
                    "user.backgroundCover": 0,
                },
            }
        ]);

        // console.log(posts);

        return res.status(200).json({
            message: "Posts fetched successfully",
            posts,
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
};




export const uploadFile = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'o2office',
            resource_type: "auto",
            transformation: [
                { width: 500, crop: "scale" },
                { quality: 'auto' },
                { fetch_format: "auto" }
            ]
        });

        fs.unlinkSync(req.file.path);

        return res.status(200).json({
            message: "File uploaded and compressed successfully",
            file: {
                url: result.secure_url,
                fileType: result.format,
                publicId: result.public_id,
            },
        });
    } catch (error) {
        console.error(error);
        if (req.file?.path) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
};


// export const likePost = async (req, res) => {
//     try {
//         const { postId } = req.query;
//         const userId = req.user._id;

//         const post = await Post.findById(postId).populate('userId', 'name profilePicture fullName');
//         if (!post) {
//             return res.status(404).json({ message: "Post not found" });
//         }

//         const postOwner = post.userId;
//         const postOwnerSocketId = getUserSocketId(postOwner._id);

//         const user = await User.findById(userId, 'name profilePicture fullName');
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         const like = await Likes.findOneAndDelete({ userId, postId });
//         if (like) {
//             post.likes = Math.max(post.likes - 1, 0);
//         } else {
//             await Likes.create({ userId, postId });
//             post.likes += 1;

//             const notification = await Notification.create({
//                 userId: postOwner._id, // The post owner's ID
//                 type: 'like',
//                 content: 'liked your post',
//                 seen: false,
//                 referenceId: post._id,
//                 user: {
//                     _id: user._id,
//                     name: user.name,
//                     profilePicture: user.profilePicture,
//                     fullName: user.fullName
//                 }
//             });

//             if (postOwnerSocketId) {
//                 console.log("notifications send  to " + postOwnerSocketId);

//                 io.to(postOwnerSocketId).emit('newNotifications', notification);
//             }
//         }

//         await post.save();

//         return res.status(200).json({
//             message: like ? "Post unliked successfully" : "Post liked successfully",
//             notification: like ? null : {
//                 content: `${user.name} liked your post`,
//                 profilePicture: user.profilePicture,
//             },
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             error: error.message,
//             message: "Internal server error",
//         });
//     }
// };


// Dislike a post

export const likePost = async (req, res) => {
    try {
        const { postId } = req.query;
        const userId = req.user._id;

        const post = await Post.findById(postId).populate('userId', 'name profilePicture fullName');
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const postOwner = post.userId;
        const postOwnerSocketId = getUserSocketId(postOwner._id);

        const user = await User.findById(userId, 'name profilePicture fullName');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const like = await Likes.findOneAndDelete({ userId, postId });
        if (like) {
            post.likes = Math.max(post.likes - 1, 0);
        } else {
            await Likes.create({ userId, postId });
            post.likes += 1;

            if (postOwner !== req.user?._id) {
                const notification = await Notification.create({
                    userId: postOwner._id, // The post owner's ID
                    type: 'like',
                    content: 'liked your post',
                    seen: false,
                    referenceId: post._id,
                    user: {
                        _id: user._id,
                        name: user.name,
                        profilePicture: user.profilePicture,
                        fullName: user.fullName
                    }
                });
                if (postOwnerSocketId) {
                    console.log("notifications send  to " + postOwnerSocketId);
                    io.to(postOwnerSocketId).emit('newNotifications', notification);
                }
            }
        }
        
        await post.save();
        return res.status(200).json({
            message: like ? "Post unliked successfully" : "Post liked successfully",
            notification: like ? null : {
                content: `${user.name} liked your post`,
                profilePicture: user.profilePicture,
            },
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
};

export const dislikePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        const existingLike = await Likes.findOne({ userId, postId });
        if (!existingLike) {
            return res.status(400).json({
                message: "You have not liked this post",
            });
        }

        await Likes.findByIdAndDelete(existingLike._id);
        post.likes -= 1;
        await post.save();

        return res.status(200).json({
            message: "Post disliked successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}
// get profile

export const getprofile = async (req, res) => {
    try {
        const { id } = req.params;

        const profile = await User.findById(id).select('-password'); // Exclude the password field
        const sellerposts = await Post.find({ userId: id })

        if (!profile) {
            return res.status(404).json({ message: "User not found" });
        }


        res.status(200).json({ profile, sellerposts }); // Return the profile data
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred", error: error.message });
    }
};

export const getcitylist = async (req, res) => {
    try {
        const value = await City.aggregate([
            {
                $project: {
                    _id: 1,
                    city: 1
                }
            }
        ]);

        if (!value || value.length === 0) {
            return res.status(404).json({ message: "City not found" });
        }

        return res.status(200).json({ value });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred", error: error.message });
    }
};

export const getcategory = async (req, res) => {
    try {

        const value = await Gallery.find({ Type: 'category' });

        if (!value) {
            return res.status(404).json({ message: "category not found" });
        }


        return res.status(200).json({ value });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred", error: error.message });
    }
};

// Get likes for a post
export const getLikes = async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

        let userId = null;
        let decodedToken = null;
        if (token) {
            try {
                decodedToken = jwt.verify(token, process.env.JWT_SECRET);
                userId = decodedToken?._id;
            } catch (error) {
                // console.error("Token verification failed:", error);
            }
        }

        const { postId } = req.query;

        // Find the post by ID
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        // Get the count of likes for the post
        const likesCount = await Likes.countDocuments({ postId });

        // If the user is authenticated, check if they have liked the post
        let isCurrUserLiked = false;

        if (userId) {
            isCurrUserLiked = await Likes.exists({ postId, userId });
        }

        return res.status(200).json({
            message: "Likes retrieved successfully",
            likesCount,
            isCurrUserLiked: !!isCurrUserLiked,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}



// comments 
export const addComment = async (req, res) => {
    try {
        const { text, postId } = req.body;
        const userId = req.user?._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const user = await User.findById(req.user?._id)
        if (!user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        const newComment = await Comment.create({
            text,
            userId,
            postId,
        })

        return res.status(201).json({
            message: "Comment added successfully",
            comment: {
                _id: newComment._id,
                text: newComment.text,
                createdAt: newComment.createdAt,
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    profilePicture: user.profilePicture,
                },
            },
        });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.query;
        const userId = req.user?._id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this comment" });
        }

        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({
            message: "Comment deleted successfully",
        });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

export const getComments = async (req, res) => {
    try {
        const { postId } = req.query;

        const comments = await Comment.aggregate([
            { $match: { postId: new mongoose.Types.ObjectId(postId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            { $sort: { updatedAt: -1 } },
            {
                $project: {
                    text: 1,
                    updatedAt: 1,
                    'user.fullName': 1,
                    'user.profilePicture': 1,
                }
            }
        ]);

        return res.status(200).json({
            message: "Comments fetched successfully",
            comments,
        });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}


export const savePost = async (req, res) => {
    try {
        const postId = req.query?.postId
        const userId = req.user._id;

        if (!postId || !userId) {
            return res.status(400).json({ message: "Invalid request" });
        }

        const alreadyexist = await SavedPost.findOneAndDelete({ postId: postId, userId: userId })
        if (alreadyexist) {
            return res.status(200).json({ message: "Post already saved" });
        }
        const newPost = await SavedPost.create({
            userId,
            postId,
        })

        const post = await SavedPost.findById(newPost._id).populate('postId')

        return res.status(201).json({
            message: "Post saved successfully",
            savedPost: post,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

export const removeFromSaved = async (req, res) => {
    try {
        const savePostId = req.query?.id

        if (!savePostId) {
            return res.status(400).json({
                message: "Invalid request"
            })
        }
        const postToDelete = await SavedPost.findOne({ postId: savePostId })

        if (!postToDelete) {
            return res.status(400).json({
                message: "Post not found"
            })
        }
        const deletepost = await SavedPost.findByIdAndDelete(postToDelete._id)

        return res.status(200).json({
            message: "delete Post successfully"
        })

    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        })
    }
}

export const getSavedPost = async (req, res) => {
    try {
        const userId = req.user._id;

        const savedPosts = await SavedPost.find({ userId: userId })
            .populate('postId')

        if (!savedPosts.length) {
            return res.status(404).json({
                message: "No saved post found"
            });
        }


        return res.status(200).json({
            message: "Saved posts fetched successfully",
            savedPosts: savedPosts
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || 'Something went wrong'
        });
    }
}

export const getReelsById = async (req, res) => {
    try {
        const id = req.query?.id;
        if (!id) {
            return res.status(400).json({
                message: "Invalid id provided"
            })
        }

        const post = await Post.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    title: 1,
                    description: 1,
                    price: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    user: {
                        _id: '$user._id',
                        fullName: '$user.fullName',
                        profilePicture: '$user.profilePicture',
                    },
                    file: 1
                }
            }
        ]);

        if (!post || post.length === 0) {
            return res.status(404).json({
                message: "Reels not found",
            });
        }

        return res.status(200).json({
            message: "Reels fetched successfully",
            post: post[0],
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message || 'Something went wrong',
            message: "Something went wrong"
        });
    }
}

export const boostpost = async (req, res) => {
    const { postId, amount } = req.body;

    try {
        // First verify if post exists and isn't already boosted
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (post.isBoosted.status) {
            return res.status(400).json({ error: 'Post is already boosted' });
        }

        const order = await razorpayInstance.orders.create({
            amount: amount, // Convert to paisa
            currency: 'INR',
            receipt: `boost-${postId}`,
            notes: {
                postId: postId
            }
        });
        res.status(201).json({
            order: order
        });

    } catch (error) {
        console.error('Order creation failed:', error);
        return res.status(500).json({
            error: 'Failed to create boost order'
        });
    }
}

export const verifyPayment = async (req, res) => {
    const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        postId
    } = req.body;

    try {
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {

            const newIsBoosted = {
                status: true,
                boostPaymentId: razorpay_payment_id
            }

            const updatedPost = await Post.findOneAndUpdate(
                { _id: postId },
                { $set: { isBoosted: newIsBoosted } },
                { new: true }
            );

            res.status(200).json({
                message: "Post successfully boosted.",
                post: updatedPost
            });

        } else {
            res.status(400).json({ error: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Payment verification failed:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
}

export const reportPost = async (req, res) => {
    const { id } = req.query;
    const { _id } = req.user

    console.log();
    const { message }= req.body

    try {
        if (!id || !_id) {
            return res.status(400).json({
                message: "Report request is invalid!"
            });
        }

        const alreadyReported = await ReportedPost.findOne({ postId: id });

        if (alreadyReported) {
            return res.status(409).json({
                message: "Post already Reported."
            });
        }

        const report = await ReportedPost.create({
            userId: _id,
            postId: id,
            reportMessage: message
        });

        return res.status(201).json({
            message: "Post Successfully Reported.",
            report: report
        })

    } catch (error) {
        res.status(500).json({
            message: 'Server Error occured, Please try again!',
            error: error
        })
    }
}


export const getUser = async (req, res) => {
    const { search } = req.query;

    if (!search) {
        return res.status(400).json({
            success: false,
            message: "Search parameter is required",
        });
    }

    try {
        const users = await User.find({
            $or: [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No users found",
            });
        }

        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        console.error("Error finding users:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


export const setView = async (req, res) => {
    try {
        const { postId } = req.query;
        const userId = req.user._id

        const view = await ReelView.find({ userId, postId })

        if (view && view.length) {
            return res.status(400).json({
                message: "View already set",
                status: 400
            })
        }

        const cretedview = await ReelView.create({
            userId,
            postId
        })

        if (!cretedview) {
            return res.status(400).json({
                message: "Failed to set view",
                status: 400
            })
        }

        return res.status(200).json({
            message: "View count updated successfully",
            status: 200
        })

    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: "Failed to set view count",
            status: 500
        })
    }
}

export const getView = async (req, res) => {
    try {
        const { postId } = req.query;

        if (!postId) {
            return res.status(400).json({
                message: "postId is required",
                status: 400
            });
        }

        const viewCount = await ReelView.countDocuments({ postId });

        return res.status(200).json({
            message: "View count fetched successfully",
            viewCount,
            status: 200
        });

    } catch (error) {
        console.error("Error fetching view count:", error);
        return res.status(500).json({
            error: error.message,
            message: "Failed to get view count",
            status: 500
        });
    }
};