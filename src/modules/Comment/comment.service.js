import CommentModel from "../../DB/models/comment.model.js";
import * as dbService from "../../DB/dbService.js";
import { asyncHandler } from "../../utils/errorHandling/asyncHandler.js";
import PostModel from "../../DB/models/post.model.js";
import cloudinary from "../../utils/file Uploading/cloudinaryConfig.js";
import { roleType } from "../../DB/models/user.model.js";

export const createComment = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { text } = req.body;

  const post = await dbService.findOne({
    model: PostModel,
    filter: { _id: postId, isDeleted: false },
  });
  if (!post) return next(new Error("post not found", { cause: 404 }));

  let customId;
  let image;
  if (req.file) {
    customId = nanoid(5);
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `Posts/${post.createdBy}/${post.customId}/comments/${customId}`,
      }
    );
    image = { secure_url, public_id };
  }

  const comment = await dbService.create({
    model: CommentModel,
    data: {
      text,
      createdBy: req.user._id,
      postId: post._id,
      image,
      customId,
    },
  });

  return res.status(201).json({ success: true, date: { comment } });
});

export const updateComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const { text } = req.body;

  const comment = await dbService.findById({
    model: CommentModel,
    id: commentId,
  });
  if (!comment) return next(new Error("comment not found", { cause: 404 }));

  const post = await dbService.findOne({
    model: PostModel,
    filter: { _id: comment.postId, isDeleted: false },
  });
  if (!post) return next(new Error("post not found", { cause: 404 }));

  if (comment.createdBy.toString() !== req.user._id.toString())
    return next(new Error("unAuthorized", { cause: 401 }));

  let image;
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: `posts/${post.createdBy}/posts/${post.customId}/comments` }
    );
    image = { secure_url, public_id };
    if (comment.image) {
      await cloudinary.uploader.destroy(comment.image.public_id);
    }
    comment.image = image;
  }

  comment.text = text ? text : comment.text;
  await comment.save();

  return res.status(200).json({ success: true, date: { comment } });
});

export const softDeleteComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const comment = await dbService.findOne({
    model: CommentModel,
    filter: { _id: commentId, isDeleted: false },
  });
  if (!comment) return next(new Error("comment not found", { cause: 404 }));

  const post = await dbService.findOne({
    model: PostModel,
    filter: { _id: comment.postId, isDeleted: false },
  });
  if (!post) return next(new Error("post not found", { cause: 404 }));

  const commentOwner = comment.createdBy.toString() === req.user._id.toString();
  const postOwner = post.createdBy.toString() === req.user._id.toString();
  const admin = req.user.role === roleType.Admin;

  if (!(commentOwner || postOwner || admin))
    return next(new Error("unAuthorized", { cause: 401 }));

  comment.isDeleted = true;
  comment.deletedBy = req.user._id;
  await comment.save();

  return res.status(200).json({ success: true, date: { comment } });
});

export const getAllComments = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await dbService.findOne({
    model: PostModel,
    filter: {
      _id: postId,
      isDeleted: false,
      parentComment: { $exists: false },
    },
    populate: [{ path: "comments", select: "text image -_id" }],
  });
  if (!post) return next(new Error("post not found", { cause: 404 }));

  if (!post.comments)
    return next(new Error("no comments found", { cause: 404 }));

  return res
    .status(200)
    .json({ success: true, date: { comments: post.comments } });
});

export const likeAndUnlikeComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const comment = await dbService.findOne({
    model: CommentModel,
    filter: { _id: commentId, isDeleted: false },
  });
  if (!comment) return next(new Error("comment not found", { cause: 404 }));

  // Check if user has already liked comment
  const isUserLiked = comment.likes.find(
    (user) => user.toString() === userId.toString()
  );

  if (isUserLiked) {
    // User already liked, so unlike
    comment.likes = comment.likes.filter(
      (user) => user.toString() !== userId.toString()
    );
  } else {
    // User hasn't liked, so like
    comment.likes.push(userId);
  }

  await comment.save();

  return res.status(200).json({ success: true, data: comment });
});

export const addReply = asyncHandler(async (req, res, next) => {
  const { commentId, postId } = req.params;

  const comment = await dbService.findOne({
    model: CommentModel,
    filter: { _id: commentId, isDeleted: false },
  });
  if (!comment) return next(new Error("comment not found", { cause: 404 }));

  const post = await dbService.findOne({
    model: PostModel,
    filter: { _id: postId, isDeleted: false },
  });

  let image;
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `Posts/${post.createdBy}/${post.customId}/comments/${comment.customId}`,
      }
    );
    image = { secure_url, public_id };
  }

  const reply = await dbService.create({
    model: CommentModel,
    data: {
      text: req.body.text,
      createdBy: req.user._id,
      postId: post._id,
      parentComment: commentId,
      image,
    },
  });

  await reply.save();

  return res.status(201).json({ success: true, data: reply });
});

export const deleteComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const comment = await dbService.findOne({
    model: CommentModel,
    filter: { _id: commentId, isDeleted: false },
  });
  if (!comment) return next(new Error("comment not found", { cause: 404 }));

  const post = await dbService.findOne({
    model: PostModel,
    filter: { _id: comment.postId, isDeleted: false },
  });
  if (!post) return next(new Error("post not found", { cause: 404 }));

  const commentOwner = comment.createdBy.toString() === req.user._id.toString();
  const postOwner = post.createdBy.toString() === req.user._id.toString();
  const admin = req.user.role === roleType.Admin;

  if (!(commentOwner || postOwner || admin))
    return next(new Error("unAuthorized", { cause: 401 }));

  await comment.deleteOne();

  return res
    .status(200)
    .json({ success: true, messge: "deleted successfully" });
});
