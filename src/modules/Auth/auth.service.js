import { OAuth2Client } from "google-auth-library";
import UserModel, { roleType, providers } from "../../DB/models/user.model.js";
import {
  checkCodeAttempts,
  emailEmitter,
} from "../../utils/email/emailevent.js";
import { asyncHandler } from "../../utils/errorHandling/asyncHandler.js";
import { compareHash, hash } from "../../utils/hashing/hash.js";
import { generateToken } from "../../utils/token/token.js";
import * as dbService from "./../../DB/dbService.js";
import { decodedToken, tokenTypes } from "../../middlewares/auth.middleware.js";

export const register = asyncHandler(async (req, res, next) => {
  const { userName, email, password } = req.body;

  const user = await dbService.findOne({ model: UserModel, filter: { email } });
  if (user) return next(new Error("User already exists", { cause: 409 }));

  const newUser = await dbService.create({
    model: UserModel,
    data: {
      userName,
      email,
      password
    },
  });

  emailEmitter.emit("sendEmail", email, userName);

  return res
    .status(200)
    .json({ success: true, message: "User registered successfully", newUser });
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { code, email } = req.body;

  const user = await dbService.findOne({ model: UserModel, filter: { email } });
  if (!user) return next(new Error("User not found", { cause: 404 }));

  if (user.confirmEmail === true)
    return next(new Error("Email already verified", { cause: 409 }));

  await checkCodeAttempts({ user, next });
  const isCorrectOTP = compareHash({
    plainText: code,
    hash: user.confirmEmailOTP,
  });

  if (!isCorrectOTP || user.otpExpire < Date.now()) {
    user.otpAttempts -= 1;
    await user.save();
    return next(new Error("invalid or expired code", { cause: 404 }));
  }

  await dbService.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      confirmEmail: true,
      otpAttempts: 5,
      $unset: { confirmEmailOTP: 0, otpAttemptsWait: 0, otpExpire: 0 },
    },
  });

  return res
    .status(200)
    .json({ success: true, message: "Email verified successfully" });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await dbService.findOne({ model: UserModel, filter: { email } });
  if (!user) return next(new Error("User Not Found", { cause: 404 }));
  if (!user.confirmEmail)
    return next(new Error("please, confirm your email first", { cause: 401 }));
  if (!compareHash({ plainText: password, hash: user.password }))
    return next(new Error("invalid Password", { cause: 400 }));

  if (user.enable2SV) {
    emailEmitter.emit("sendEmail", user.email, user.userName);
    return res.status(200).json({
      success: true,
      message: "send verification code to your email",
    });
  }

  const access_token = generateToken({
    payload: { id: user._id },
    signature:
      user.role === roleType.User
        ? process.env.USER_ACCESS_TOKEN
        : process.env.ADMIN_ACCESS_TOKEN,
    options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES },
  });

  const refresh_token = generateToken({
    payload: { id: user._id },
    signature:
      user.role === roleType.User
        ? process.env.USER_REFRESH_TOKEN
        : process.env.ADMIN_REFRESH_TOKEN,
    options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES },
  });

  return res.status(200).json({
    success: true,
    tokens: {
      access_token,
      refresh_token,
    },
  });
});

export const loginConfirmation = asyncHandler(async (req, res, next) => {
  const { code, email } = req.body;
  const user = await dbService.findOne({ model: UserModel, filter: { email } });
  if (!user) return next(new Error("User Not Found", { cause: 404 }));

  const isCorrectOTP = compareHash({
    plainText: code,
    hash: user.confirmEmailOTP,
  });

  if (!isCorrectOTP || user.otpExpire < Date.now()) {
    return next(new Error("invalid or expired code", { cause: 404 }));
  }

  await dbService.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      $unset: { confirmEmailOTP: 0, otpExpire: 0 },
    },
  });

  const access_token = generateToken({
    payload: { id: user._id },
    signature:
      user.role === roleType.User
        ? process.env.USER_ACCESS_TOKEN
        : process.env.ADMIN_ACCESS_TOKEN,
    options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES },
  });

  const refresh_token = generateToken({
    payload: { id: user._id },
    signature:
      user.role === roleType.User
        ? process.env.USER_REFRESH_TOKEN
        : process.env.ADMIN_REFRESH_TOKEN,
    options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES },
  });

  return res.status(200).json({
    success: true,
    tokens: {
      access_token,
      refresh_token,
    },
  });
});

export const refreshToken = asyncHandler(async (req, res, next) => {
  const { authorization } = req.headers;
  const user = await decodedToken({
    authorization,
    tokenType: tokenTypes.refresh,
    next,
  });
  const access_token = generateToken({
    payload: { id: user._id },
    signature:
      user.role === roleType.User
        ? process.env.USER_ACCESS_TOKEN
        : process.env.ADMIN_ACCESS_TOKEN,
    options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES },
  });

  const refresh_token = generateToken({
    payload: { id: user._id },
    signature:
      user.role === roleType.User
        ? process.env.USER_REFRESH_TOKEN
        : process.env.ADMIN_REFRESH_TOKEN,
    options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES },
  });

  return res.status(200).json({
    success: true,
    tokens: {
      access_token,
      refresh_token,
    },
  });
});

export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await dbService.findOne({
    model: UserModel,
    filter: { email, isDeleted: false },
  });
  if (!user) return next(new Error("User Not Found", { cause: 404 }));

  emailEmitter.emit("sendResetPasswordEmail", email, user.userName);
  return res.status(200).json({
    success: true,
    message: "Email sent successfully",
  });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, code, password } = req.body;
  const user = await dbService.findOne({
    model: UserModel,
    filter: { email, isDeleted: false },
  });
  if (!user) return next(new Error("User Not Found", { cause: 404 }));

  await checkCodeAttempts({ user, next });

  const isCorrectOTP = compareHash({
    plainText: code,
    hash: user.forgetPasswordOTP,
  });

  if (!isCorrectOTP || user.otpExpire < Date.now()) {
    user.otpAttempts -= 1;
    await user.save();
    return next(new Error("invalid or expired code", { cause: 404 }));
  }
  const hashPassword = hash({ plainText: password });

  await dbService.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      password: hashPassword,
      $unset: { forgetPasswordOTP: "", otpAttemptsWait: 0, otpExpire: 0 },
    },
  });

  return res.status(200).json({
    success: true,
    message: "password reset successfully",
  });
});

export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  }
  const { name, email, picture, email_verified } = await verify();

  if (!email_verified) {
    return next(new Error("Email Not Verified", { cause: 401 }));
  }

  let user = await dbService.findOne({
    model: UserModel,
    filter: { email, isDeleted: false },
  });

  if (user?.providers === providers.System)
    return next(new Error("User already exist", { cause: 409 }));

  if (!user) {
    user = await dbService.create({
      model: UserModel,
      data: {
        userName: name,
        email,
        image: picture,
        confirmEmail: email_verified,
        providers: providers.Google,
      },
    });
  }

  const access_token = generateToken({
    payload: { id: user._id },
    signature:
      user.role === roleType.User
        ? process.env.USER_ACCESS_TOKEN
        : process.env.ADMIN_ACCESS_TOKEN,
    options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES },
  });

  const refresh_token = generateToken({
    payload: { id: user._id },
    signature:
      user.role === roleType.User
        ? process.env.USER_REFRESH_TOKEN
        : process.env.ADMIN_REFRESH_TOKEN,
    options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES },
  });

  return res.status(200).json({
    success: true,
    tokens: {
      access_token,
      refresh_token,
    },
  });
});
