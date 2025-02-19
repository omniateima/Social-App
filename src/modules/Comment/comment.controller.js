import { Router } from "express";
import { uploadCloud } from "../../utils/file Uploading/multerCloud.js";
import { allowTo, authentication } from "../../middlewares/auth.middleware.js";
import * as commentValidation from "../Comment/comment.validation.js";
import * as commentService from "../Comment/comment.service.js";
import { fileValidation } from "../../utils/file Uploading/multerUpload.js";
import { validation } from "../../middlewares/validation.middleware.js";

const router = Router({ mergeParams: true });

//post/:postId/comment
router
  .route("/")
  .post(
    authentication(),
    allowTo(["User"]),
    uploadCloud(fileValidation.images).single("image"),
    validation(commentValidation.createCommentSchema),
    commentService.createComment
  )
  .get(
    authentication(),
    allowTo(["User", "Admin"]),
    validation(commentValidation.getCommentsSchema),
    commentService.getAllComments
  );

router.patch(
  "/updateComment/:commentId",
  authentication(),
  allowTo(["User"]),
  uploadCloud(fileValidation.images).single("image"),
  validation(commentValidation.updateCommentSchema),
  commentService.updateComment
);

router.patch(
  "/softDelete/:commentId",
  authentication(),
  allowTo(["User", "Admin"]),
  validation(commentValidation.softDeleteSchema),
  commentService.softDeleteComment
);

//post/:postId/comment

router.patch(
  "/like_unlike/:commentId",
  authentication(),
  allowTo(["User"]),
  validation(commentValidation.likeUnlikeSchema),
  commentService.likeAndUnlikeComment
);

//reply
//post/:postId/comment/:commentId
router
  .route("/:commentId")
  .post(
    authentication(),
    allowTo(["User"]),
    uploadCloud(fileValidation.images).single("image"),
    validation(commentValidation.addReplySchema),
    commentService.addReply
  )
  .delete(
    authentication(),
    allowTo(["User", "Admin"]),
    validation(commentValidation.deleteComment),
    commentService.deleteComment
  );

export default router;
