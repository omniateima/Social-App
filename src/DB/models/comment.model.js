import mongoose, { Schema, Types, model } from "mongoose";
import cloudinary from "../../utils/file Uploading/cloudinaryConfig.js";

const commentSchema = new Schema(
  {
    text: {
      type: String,
      minLength: [3, "comment must be at least 3 characters long"],
      maxLength: [5000, "comment must be at most 30 characters long"],
      trim: true,
      required: function () {
        return this.image?.length ? false : true;
      },
    },
    postId: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
    },
    image: {
      secure_url: String,
      public_id: String,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    likes: [{ type: Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
    customId: String,
    parentComment: {
      type: Types.ObjectId,
      ref: "Comment",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
});

commentSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function (doc, next) {
    if (doc.image.secure_url) {
      await cloudinary.uploader.destroy(doc.image.public_id);
    }
    const replies = await this.constructor.find({ parentComment: doc._id });
    if (replies.length > 0) {
      for (const reply of replies) {
        await reply.deleteOne();
      }
    }
    return next();
  }
);

const CommentModel = mongoose.model.Comment || model("Comment", commentSchema);
export default CommentModel;
