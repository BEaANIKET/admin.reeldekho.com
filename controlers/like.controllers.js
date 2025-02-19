import { Likes } from "../models/like.models.js";
import { Post } from "../models/post.models.js";

export const getLikes= async(req, res) => {
    const { id }= req.query;
    try {
        if (!id) {
            return res.status(400).json({
                message: "Post id is required!",
            });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({
                message: "No post found with the provided id",
            });
        }

        const likes = await Likes.find({ postId: post._id })
            .populate("userId", "fullName profilePicture");

        return res.status(200).json(likes);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Something went wrong",
        });
    }
}