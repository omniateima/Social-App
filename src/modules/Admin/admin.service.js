import UserModel from "../../DB/models/user.model.js";
import PostModel from "../../DB/models/post.model.js";
import { asyncHandler } from "../../utils/errorHandling/asyncHandler.js";
import * as dbService from "./../../DB/dbService.js";

export const getAllUsersAndPosts = asyncHandler(async (req, res, next) => {
  const results = await Promise.all([
    dbService.find({
      model: UserModel,
    }),
    dbService.find({
      model: PostModel,
    }),
  ]);

  return res.status(200).json({
    success: true,
    data: results,
  });
});

export const changeRole = asyncHandler(async (req, res, next) => {
  const { role, userId } = req.body;
  const user = await dbService.findByIdAndUpdate({
    model: UserModel,
    id: userId,
    data: { role },
    options: { new: true },
  });

  return res.status(200).json({
    success: true,
    data: { user },
  });
});
