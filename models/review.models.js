import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalStars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewMessage: {
      type: String,
    }
  },
  { timestamps: true }
);

reviewSchema.index({ reviewerId: 1, reviewedId: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
