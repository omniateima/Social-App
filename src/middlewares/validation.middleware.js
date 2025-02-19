import joi from "joi";
import { Types } from "mongoose";
import { genderType } from "../DB/models/user.model.js";

export const isValidObjectId = (value, helper) => {
  if (Types.ObjectId.isValid(value)) return value;
  return helper.message("Value must be a valid ObjectId");
};

export const generalField = {
  userName: joi.string().min(3).max(30),
  email: joi
    .string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } }),
  password: joi
    .string()
    .pattern(new RegExp(/^((?=\S*?[A-Z])(?=\S*?[a-z])(?=\S*?[0-9]).{6,})\S$/)),
  confirmPassword: joi.string().valid(joi.ref("password")),
  code: joi.string().pattern(new RegExp(/^[0-9]{6}/)),
  id: joi.custom(isValidObjectId),
  DOB: joi.date().less("now"),
  gender: joi.string().valid(...Object.values(genderType)),
  address: joi.string(),
  phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)),
  fileobj: joi.object({
    fieldname: joi.string().required(),
    originalname: joi.string().required(),
    encoding: joi.string().required(),
    mimetype: joi.string().required(),
    size: joi.number().required(),
    destination: joi.string().required(),
    filename: joi.string().required(),
    path: joi.string().required(),
  }),
};

export const validation = (schema) => {
  return (req, res, next) => {
    const data = { ...req.body, ...req.params, ...req.query };
    if (req.file || req.files?.length) {
      data.file = req.file || req.files;
    }
    const results = schema.validate(data, { abortEarly: false });
    if (results.error) {
      const errorMessage = results.error.details.map((obj) => obj.message);
      return res.status(400).json({ success: false, message: errorMessage });
    }
    return next();
  };
};
