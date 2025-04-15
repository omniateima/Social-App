import mongoose, { Schema, Types, model } from "mongoose";

export const reacts = { love: "love", like: "like", haha: "haha" };

const postSchema = new Schema(
  {
    content: {
      type: String,
      minLength: [3, "User name must be at least 3 characters long"],
      maxLength: [5000, "User name must be at most 30 characters long"],
      trim: true,
      required: function () {
        return this.image?.length ? false : true;
      },
    },
    images: [
      {
        secure_url: String,
        public_id: String,
      },
    ],
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
    },

    reacts: [
      {
        ids: [{ type: Types.ObjectId, ref: "User" }],
        react: {
          type: String,
          enum: {
            values: Object.values(reacts),
            message: "react is not supported",
          },
        },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    customId: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "postId",
  localField: "_id",
});

postSchema.query.paginate = async function (page) {
  page = page ? page : 1;
  //limit
  const limit = 5;
  //skip
  const skip = (page - 1) * limit;

  const data = await this.skip(skip).limit(limit);
  const items = await this.model.countDocuments();
  const totalPages = Math.ceil(items / limit);
  const nextPage = Number(page) >= totalPages ? null : Number(page) + 1;
  const previousPage = Number(page) <= 1 ? null : Number(page) - 1;

  return {
    data,
    totalItems: items,
    totalPages,
    previousPage,
    currentPage: Number(page),
    itemPerPage: data.length,
    nextPage,
  };
};

const PostModel = mongoose.model.Post || model("Post", postSchema);
export default PostModel;
