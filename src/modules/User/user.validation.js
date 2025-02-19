import joi from "joi";
import { generalField } from "../../middlewares/validation.middleware.js";

export const shareProfileSchema = joi
  .object({ profileId: generalField.id.required() })
  .required();

export const updateEmailSchema = joi
  .object({ email: generalField.email.required() })
  .required();

export const resetEmailSchema = joi
  .object({
    oldCode: generalField.code.required(),
    newCode: generalField.code.required(),
  })
  .required();

export const updatePasswordSchema = joi
  .object({
    oldPassword: generalField.password.required(),
    password: generalField.password.not(joi.ref("oldPassword")).required(),
    confirmPassword: generalField.confirmPassword.required(),
  })
  .required();

export const updateProfileSchema = joi
  .object({
    userName: generalField.userName,
    phone: generalField.phone,
    gender: generalField.gender,
    DOB: generalField.DOB,
    address: generalField.address,
  })
  .required();

export const requestEnable2SVSchema = joi
  .object({
    password: generalField.password.required(),
  })
  .required();

export const enable2SVSchema = joi
  .object({
    code: generalField.code.required(),
  })
  .required();

export const blockUser = joi
  .object({
    email: generalField.email.required(),
  })
  .required();
