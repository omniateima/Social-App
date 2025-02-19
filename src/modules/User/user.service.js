import path from "path";
import fs from "fs";
import UserModel, {
  defaultImage,
  defaultImgPublicIdCloud,
  defaultImgUrlCloud,
} from "../../DB/models/user.model.js";
import { emailEmitter } from "../../utils/email/emailevent.js";
import { asyncHandler } from "../../utils/errorHandling/asyncHandler.js";
import * as dbService from "./../../DB/dbService.js";
import { compareHash, hash } from "../../utils/hashing/hash.js";
import { encrypt } from "../../utils/encryption//encryption.js";
import cloudinary from "../../utils/file Uploading/cloudinaryConfig.js";

export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await dbService.findOne({
    model: UserModel,
    filter: { _id: req.user._id },
    populate: [
      {
        path: "viewers.userId",
        select: "userName email image -_id",
      },
    ],
  });

  return res.status(200).json({
    success: true,
    user,
  });
});

export const shareProfile = asyncHandler(async (req, res, next) => {
  const { profileId } = req.params;
  let user = undefined;
  if (profileId === req.user._id.toString()) {
    user = req.user;
  } else {
    user = await dbService.findOne({
      model: UserModel,
      filter: { _id: profileId, isDeleted: false },
    });
    if (!user) return next(new Error("User not found", { cause: 404 }));
    if(user.blockedUsers.includes(req.user._id))
      return next(new Error("You are blocked", { cause: 404 }));

    const viewerIndex = user.viewers.findIndex(
      (viewer) => viewer.userId.toString() === req.user._id.toString()
    );
    if (viewerIndex !== -1) {
      // existing viewer
      user.viewers[viewerIndex].visitCount += 1;
      user.viewers[viewerIndex].time = Date.now();
    } else {
      // Add a new user
      user.viewers.push({
        userId: req.user._id,
        time: Date.now(),
      });
    }
    user = await dbService.findOneAndUpdate({
      model: UserModel,
      filter: { _id: profileId },
      data: { viewers: user.viewers },
      options: { new: true, runValidators: true },
    });
  }
  return res.status(200).json({ success: true, data: user });
});

export const updateEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (await dbService.findOne({ model: UserModel, filter: { email } }))
    return next(new Error("email already exists", { cause: 409 }));
  await dbService.updateOne({
    model: UserModel,
    filter: { _id: req.user._id },
    data: { tempEmail: email },
  });
  emailEmitter.emit(
    "sendEmail",
    req.user.email,
    req.user.userName,
    req.user._id
  );
  emailEmitter.emit("sendUpdateEmail", email, req.user.userName, req.user._id);
  return res.status(200).json({ success: true, data: {} });
});

export const resetEmail = asyncHandler(async (req, res, next) => {
  const { oldCode, newCode } = req.body;
  if (
    !compareHash({ plainText: oldCode, hash: req.user.confirmEmailOTP }) ||
    !compareHash({ plainText: newCode, hash: req.user.tempEmailOTP })
  ) {
    return next(new Error("Invalid code", { cause: 400 }));
  }
  const user = await dbService.updateOne({
    model: UserModel,
    filter: { _id: req.user._id },
    data: {
      email: req.user.tempEmail,
      changeCredentailsTime: Date.now(),
      $unset: { confirmEmailOTP: "", tempEmailOTP: "", tempEmail: "" },
    },
  });

  return res.status(200).json({ success: true, data: { user } });
});

export const requestEnable2SV = asyncHandler(async (req, res, next) => {
  //user is logged and request to enable 2sv so asked him to enter his password then send OTP
  const { password } = req.body;
  if (!compareHash({ plainText: password, hash: req.user.password }))
    return next(new Error("invalid Password ", { cause: 400 }));
  emailEmitter.emit(
    "sendEnable2SVEmail",
    req.user.email,
    req.user.userName,
    req.user._id
  );
  return res.status(200).json({
    success: true,
    message: "send enable 2-step-verification email successfully",
  });
});

export const enable2SV = asyncHandler(async (req, res, next) => {
  //verify and enable 2SV
  const { code } = req.body;
  const user = await dbService.findById({
    model: UserModel,
    id: req.user._id,
  });
  if (!user) return next(new Error("User not found", { cause: 404 }));

  const isCorrectOTP = compareHash({
    plainText: code,
    hash: user.confirmEmailOTP,
  });

  if (!isCorrectOTP || user.otpExpire < Date.now()) {
    return next(new Error("invalid or expired code", { cause: 404 }));
  }

  await dbService.findByIdAndUpdate({
    model: UserModel,
    id: req.user._id,
    data: {
      enable2SV: true,
      $unset: { confirmEmailOTP: 0, otpExpire: 0 },
    },
  });
  return res.status(200).json({
    success: true,
    message: " Enable 2-step-verification successfully",
  });
});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, password } = req.body;
  if (!compareHash({ plainText: oldPassword, hash: req.user.password })) {
    return next(new Error("old password not correct", { cause: 400 }));
  }
  await dbService.updateOne({
    model: UserModel,
    filter: { _id: req.user._id },
    data: {
      password: hash({ plainText: password }),
      changeCredentailsTime: Date.now(),
    },
  });

  return res
    .status(200)
    .json({ success: true, message: "password updated successfully" });
});

export const updateProfile = asyncHandler(async (req, res, next) => {
  if (req.body.phone) {
    req.body.phone = encrypt({
      plainText: req.body.phone,
      signature: process.env.ENCRYPTION_SECRET,
    });
  }
  const user = await dbService.findOneAndUpdate({
    model: UserModel,
    filter: { _id: req.user._id },
    data: req.body,
    options: { new: true, runValidators: true },
  });
  return res.status(200).json({ success: true, data: user });
});

export const uploadImageDisk = asyncHandler(async (req, res, next) => {
  const user = await dbService.findByIdAndUpdate({
    model: UserModel,
    id: { _id: req.user._id },
    data: { image: req.file.path },
    options: { new: true },
  });
  return res.status(200).json({ success: true, data: user });
});

export const deleteImage = asyncHandler(async (req, res, next) => {
  const user = await dbService.findById({
    model: UserModel,
    id: { _id: req.user._id },
  });
  const imagePath = path.resolve(".", user.image);
  fs.unlinkSync(imagePath);
  user.image = defaultImage;
  await user.save();
  return res.status(200).json({ success: true, data: user });
});

export const uploadMultipleImagesDisk = asyncHandler(async (req, res, next) => {
  const images = req.files.map((obj) => obj.path);
  const user = await dbService.findByIdAndUpdate({
    model: UserModel,
    id: { _id: req.user._id },
    data: { coverImages: images },
    options: { new: true },
  });
  return res.status(200).json({ success: true, data: user });
});

export const uploadImageCloud = asyncHandler(async (req, res, next) => {
  const user = await dbService.findById({
    model: UserModel,
    id: { _id: req.user._id },
  });

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `Users/${user._id}/profilePicture`,
      // transformation: [{ width: 500, height: 500, crop: "fill" }],
    }
  );
  user.imagecloud = { secure_url, public_id };
  await user.save();
  return res.status(200).json({ success: true, data: user });
});

export const deleteImageCloud = asyncHandler(async (req, res, next) => {
  const user = await dbService.findById({
    model: UserModel,
    id: { _id: req.user._id },
  });

  const results = await cloudinary.uploader.destroy(user.imagecloud.public_id);
  if (results.result === "ok") {
    user.imagecloud = {
      secure_url: defaultImgUrlCloud,
      public_id: defaultImgPublicIdCloud,
    };
  } else {
    return next(
      new Error("there's a problem while deleting picture", { cause: 400 })
    );
  }
  await user.save();
  return res.status(200).json({ success: true, data: results });
});

export const blockUser = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await dbService.findOne({
    model: UserModel,
    filter: { email },
  });
  if (!user) return next(new Error("User not found", { cause: 404 }));

  if (!req.user.blockedUsers)
    req.user.blockedUsers = []
  else if (req.user.blockedUsers.includes(user._id))
    return next(new Error("User already blocked!", { cause: 401 }));

  req.user.blockedUsers.push(user._id);
  await dbService.findByIdAndUpdate({
    model: UserModel,
    id: req.user._id,
    data: { blockedUsers: req.user.blockedUsers },
  });

  return res
    .status(200)
    .json({ success: true, message: "User blocked successfully" });
});
