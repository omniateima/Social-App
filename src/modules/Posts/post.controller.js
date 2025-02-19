import { Router } from "express";
import * as postService from "./post.service.js";
import * as postValidation from "./post.validation.js";
import { uploadCloud } from "../../utils/file Uploading/multerCloud.js";
import { allowTo, authentication } from "../../middlewares/auth.middleware.js";
import { fileValidation } from "../../utils/file Uploading/multerUpload.js";
import { validation } from "../../middlewares/validation.middleware.js";
import commentRouter from "../Comment/comment.controller.js"

const router = Router();


// //post/:postId/comment
router.use("/:postId/comment", commentRouter)

router.post(
  "/createPost",
  authentication(),
  allowTo(["User"]),
  uploadCloud(fileValidation.images).array("images", 5), // parsing formData (req.body). req.file || req.files
  validation(postValidation.createPostSchema),
  postService.createPost
);

router.patch(
  "/update/:postId",
  authentication(),
  allowTo(["User"]),
  uploadCloud(fileValidation.images).array("images", 5),
  validation(postValidation.updatePostSchema),
  postService.updatePost
);

router.delete(
  "/undoPost/:postId",
  authentication(),
  allowTo(["User"]),
  validation(postValidation.undoSchema),
  postService.undoPost
);

router.patch(
    "/softDelete/:postId",
    authentication(),
    allowTo(["User", "Admin"]),
    validation(postValidation.softDeleteSchema),
    postService.softDelete
);

router.patch(
    "/restorePost/:postId",
    authentication(),
    allowTo(["User", "Admin"]),
    validation(postValidation.restoreSchema),
    postService.restorePost
);

router.get(
    "/singlePost/:postId",
    authentication(),
    allowTo(["User", "Admin"]),
    validation(postValidation.getSinglePostSchema),
    postService.getPost
);

router.get(
  "/activePosts",
  authentication(),
  allowTo(["User", "Admin"]),
  postService.activePosts
);

router.get(
  "/freezedPosts",
  authentication(),
  allowTo(["User", "Admin"]),
  postService.freezedPosts
);

router.patch(
  "/like_unlike/:postId",
  authentication(),
  allowTo(["User"]),
  validation(postValidation.likeUnlikeSchema),
  postService.likeAndUnlike
);


export default router;
