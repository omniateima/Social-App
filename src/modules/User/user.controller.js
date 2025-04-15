import { Router } from "express";
import { authentication } from "../../middlewares/auth.middleware.js";
import { validation } from "../../middlewares/validation.middleware.js";
import * as userService from "./user.service.js";
import * as userValidation from "./user.validation.js";
import {
  fileValidation,
  upload,
} from "../../utils/file Uploading/multerUpload.js";
import { uploadCloud } from "../../utils/file Uploading/multerCloud.js";

const router = Router();

router.get("/profile", authentication(), userService.getProfile);

router.get(
  "/profile/:profileId",
  validation(userValidation.shareProfileSchema),
  authentication(),
  userService.shareProfile
);

router.patch(
  "/profile/email",
  validation(userValidation.updateEmailSchema),
  authentication(),
  userService.updateEmail
);

router.patch(
  "/profile/reset_email",
  validation(userValidation.resetEmailSchema),
  authentication(),
  userService.resetEmail
);

router.patch(
  "/updatePassword",
  validation(userValidation.updatePasswordSchema),
  authentication(),
  userService.updatePassword
);

router.patch(
  "/profile",
  validation(userValidation.updateProfileSchema),
  authentication(),
  userService.updateProfile
);

router.post(
  "/requestEnable2SV",
  validation(userValidation.requestEnable2SVSchema),
  authentication(),
  userService.requestEnable2SV
);

router.patch(
  "/enable2SV",
  validation(userValidation.enable2SVSchema),
  authentication(),
  userService.enable2SV
);

router.post(
  "/profilePicture",
  authentication(),
  upload(fileValidation.images, "upload/user").single("image"),
  userService.uploadImageDisk
);
router.post(
  "/multipleImages",
  authentication(),
  upload(fileValidation.images, "upload/user").array("images", 3),
  userService.uploadMultipleImagesDisk
);

router.delete("/deleteImage", authentication(), userService.deleteImage);

router.post(
  "/uploadCloud",
  authentication(),
  uploadCloud(fileValidation.images).single("image"),
  userService.uploadImageCloud
);

router.delete(
  "/deleteProfilePictureCloud",
  authentication(),
  userService.deleteImageCloud
);

router.patch(
  "/blockUser",
  validation(userValidation.blockUser),
  authentication(),
  userService.blockUser
);

router.post(
  "/friend-request/:friendId",
  authentication(),
  validation(userValidation.friendRequestSchema),
  userService.sendFriendRequest
);

router.post(
  "/friend-request/:friendId/accept",
  authentication(),
  validation(userValidation.friendRequestSchema),
  userService.acceptFriendRequest
);

export default router;
