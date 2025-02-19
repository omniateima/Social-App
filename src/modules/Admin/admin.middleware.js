import UserModel, { roleType } from "../../DB/models/user.model.js";
import { asyncHandler } from "../../utils/errorHandling/asyncHandler.js";
import * as dbService from "./../../DB/dbService.js";

export const changeRole = asyncHandler(async (req, res, next) => {
  const allRoles = Object.values(roleType);
  // user login
  const userReq = req.user;

  // target
  const targetUser = await dbService.findById({
    model: UserModel,
    id: req.body.userId,
  });

  const userReqRole = userReq.role; // admin
  const targetUserRole = targetUser.role; // user

  const userReqIndex = allRoles.indexOf(userReqRole);
  const targetUserIndex = allRoles.indexOf(targetUserRole);

  const canModify = userReqIndex < targetUserIndex;

  if (!canModify) return next(new Error("Unauthorized", { cause: 401 }));
  return next();
});
