import { asyncHandler } from "../../utils/errorHandling/asyncHandler.js";
import { nanoid } from "nanoid";
import cloudinary from "../../utils/file Uploading/cloudinaryConfig.js";
import * as dbService from "./../../DB/dbService.js";
import PostModel from "../../DB/models/post.model.js";
import { roleType } from "../../DB/models/user.model.js";


export const createPost = asyncHandler(async (req, res, next) => {
  const { content } = req.body;
  const allImages = [];
  let customId;
  if (req.files.length) {
    customId = nanoid(5);
    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `Posts/${req.user._id}/${customId}`,
        }
      );
      allImages.push({ secure_url, public_id });
    }
  }
  const post = await dbService.create({
    model: PostModel,
    data: {
      content,
      images: allImages,
      createdBy: req.user._id,
      customId,
    },
  });
  return res.status(201).json({ success: true, data: { post } });
});

export const updatePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { content } = req.body;
  const post = await dbService.findOne({
    model: PostModel,
    filter: { _id: postId, createdBy: req.user._id },
  });
  if (!post)
    return next(new Error("Post not found | not allowed", { cause: 404 }));

  const allImages = [];
  let customId = post.customId;
  if (req.files?.length) {
    if (customId) {
      for (const image of post.images)
        await cloudinary.uploader.destroy(image.public_id);
    } else customId = nanoid(5);
    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `Posts/${req.user._id}/${customId}`,
        }
      );
      allImages.push({ secure_url, public_id });
    }
    post.images = allImages;
    post.customId = customId;
  }

  post.content = content ? content : post.content;
  await post.save();

  return res.status(200).json({ success: true, data: { post } });
});

export const softDelete = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await dbService.findById({
    model: PostModel,
    id: postId,
  });
  if (!post || post.isDeleted)
    return next(new Error("Post not found | Deleted", { cause: 404 }));

  if (
    post.createdBy.toString() === req.user._id.toString() ||
    req.user.role === roleType.Admin
  ) {
    post.isDeleted = true;
    post.deletedBy = req.user._id;

    await post.save();
    return res.status(200).json({ success: true, data: post });
  } else {
    return next(new Error("Unauthorized", { cause: 401 }));
  }
});

export const undoPost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await dbService.findById({
    model: PostModel,
    id: postId,
  });
  if (!post) return next(new Error("Post not found ", { cause: 404 }));

  let currentDate = new Date();
  const timeDifference = (currentDate - post.createdAt) / (1000 * 60);
  if (timeDifference >= 2)
    return next(new Error("you can't undo this post", { cause: 403 }));
  for (const image of post.images)
    await cloudinary.uploader.destroy(image.public_id);

  await dbService.findByIdAndDelete({
    model: PostModel,
    id: postId,
  });

  return res.status(200).json({ success: true, data: post });
});

export const restorePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  let post = await dbService.findOne({
    model: PostModel,
    filter: { _id: postId, isDeleted: true },
    populate: [{ path: "deletedBy", select: "role" }],
  });
  if (!post)
    return next(new Error("Post not found | not deleted", { cause: 404 }));

  // if admin delete the post another admin can restore it
  if (
    post.deletedBy._id.toString() === req.user._id.toString() ||
    (req.user.role === roleType.Admin && post.deletedBy.role === "Admin")
  ) {
    post = await dbService.findByIdAndUpdate({
      model: PostModel,
      id: postId,
      data: {
        isDeleted: false,
        $unset: { deletedBy: "" },
      },
      options: { new: true },
    });
  } else return next(new Error("Unauthorized", { cause: 401 }));

  return res.status(200).json({ success: true, data: post });
});

export const getPost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await dbService.findOne({
    model: PostModel,
    filter: { _id: postId, isDeleted: false },
    populate: [
      { path: "createdBy", select: "userName image blockedUsers _id" },
      {
        path: "comments",
        select: "text image -_id",
        match: { parentComment: { $exists: false } },
        populate: [
          { path: "createdBy", select: "userName image -_id" },
          { path: "replies" },
        ],
      },
    ],
  });
  if (!post) return next(new Error("Post not found", { cause: 404 }));

  if (post.createdBy.blockedUsers.includes(req.user._id))
    return next(new Error("You are blocked", { cause: 401 }));

  return res.status(200).json({ success: true, data: post });
});

export const activePosts = asyncHandler(async (req, res, next) => {
  let posts;
  if (req.user.role === roleType.Admin) {
    posts = await dbService.find({
      model: PostModel,
      filter: { isDeleted: false },
      populate: [
        { path: "createdBy", select: "userName image -_id" },
        { path: "comments", select: "userName image -_id" },
      ],
    });
  } else {
    posts = await dbService.find({
      model: PostModel,
      filter: { isDeleted: false, createdBy: req.user._id },
      populate: [
        { path: "createdBy", select: "userName image -_id" },
        { path: "comments", select: "userName image -_id" },
      ],
    });
  }

  //query stream
  // const cursor = PostModel.find({ isDeleted: false }).cursor();
  // let results = [];
  // for (
  //   let post = await cursor.next();
  //   post != null;
  //   post = await cursor.next()
  // ) {
  //   const comments = await dbService.find({
  //     model: CommentModel,
  //     filter: { postId: post._id, isDeleted: false },
  //     select: "text image -_id",
  //   });
  //   results.push({ post, comments });
  // }

  return res.status(200).json({ success: true, data: { posts } });
});

export const freezedPosts = asyncHandler(async (req, res, next) => {
  let posts;

  if (req.user.role === roleType.Admin) {
    posts = await dbService.find({
      model: PostModel,
      filter: { isDeleted: true },
      populate: [{ path: "createdBy", select: "userName image -_id" }],
    });
  } else {
    posts = await dbService.find({
      model: PostModel,
      filter: { isDeleted: true, createdBy: req.user._id },
      populate: [{ path: "createdBy", select: "userName image -_id" }],
    });
  }

  return res.status(200).json({ success: true, data: posts });
});

export const likeAndUnlike = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { react } = req.body;
  const userId = req.user._id;

  const post = await dbService.findOne({
    model: PostModel,
    filter: { _id: postId, isDeleted: false },
  });

  if (!post) return next(new Error("Post not found", { cause: 404 }));

  // Check if user has already react on post
  const isUserReact = post.reacts.find(
    (user) => user.react === react && user.ids.includes(userId)
  );

  if (isUserReact) {
    post.reacts = post.reacts.map((user) => {
      if (user.react === react) {
        user.ids = user.ids.filter((id) => id.toString() !== userId.toString());
      }
      return user;
    });
  } else {
    let reactExists = false;
    post.reacts.forEach((user) => {
      if (user.react === react) {
        user.ids.push(userId);
        reactExists = true;
      }
    });
    if (!reactExists) {
      post.reacts.push({ react: react, ids: [userId] });
    }
  }

  await post.save();

  const populatedUsers = await dbService.findOne({
    model: PostModel,
    filter: { _id: postId, isDeleted: false },
    populate: [{ path: "reacts.ids", select: "userName imagecloud -_id" }],
  });
  return res.status(200).json({ success: true, data: populatedUsers });
});
