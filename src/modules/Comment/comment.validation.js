import joi from "joi";
import { generalField } from "../../middlewares/validation.middleware.js";


export const createCommentSchema = joi
  .object({
    postId: generalField.id.required(),
    text: joi.string().min(2).max(5000),
    file: generalField.fileobj,
  })
  .or("text", "file");

export const updateCommentSchema = joi
  .object({
    commentId: generalField.id.required(),
    text: joi.string().min(2).max(5000),
    file: generalField.fileobj,
  })
  .or("text", "file");

export const softDeleteSchema = joi
  .object({
    commentId: generalField.id.required(),
  })
  .required();

export const getCommentsSchema = joi
  .object({
    postId: generalField.id.required(),
  })
  .required();

export const likeUnlikeSchema = joi
  .object({
    commentId: generalField.id.required(),
  })
  .required();

export const deleteComment = joi
  .object({
    commentId: generalField.id.required(),
  })
  .required();

export const addReplySchema = joi
  .object({
    postId: generalField.id.required(),
    commentId: generalField.id.required(),
    text: joi.string().min(2).max(5000),
    file: generalField.fileobj,
  })
  .or("text", "file");;
