import joi from "joi";
import { generalField } from "../../middlewares/validation.middleware.js";
import { reacts } from "../../DB/models/post.model.js";

export const createPostSchema = joi
  .object({
    content: joi.string().min(2).max(5000),
    file: joi.array().items(generalField.fileobj.required()),
  })
  .or("content", "file");

export const updatePostSchema = joi
  .object({
    postId: generalField.id.required(),
    content: joi.string().min(2).max(5000),
    file: joi.array().items(generalField.fileobj.required()),
  })
  .or("content", "file");

export const softDeleteSchema = joi
  .object({
    postId: generalField.id.required(),
  })
  .required();

export const restoreSchema = joi
  .object({
    postId: generalField.id.required(),
  })
  .required();

export const undoSchema = joi
  .object({
    postId: generalField.id.required(),
  })
  .required();

export const getSinglePostSchema = joi
  .object({
    postId: generalField.id.required(),
  })
  .required();

export const likeUnlikeSchema = joi
  .object({
    postId: generalField.id.required(),
    react: joi.string().valid(...Object.values(reacts))
  })
  .required();
