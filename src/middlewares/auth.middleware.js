import * as dbService from "../DB/dbService.js";
import { asyncHandler } from "../utils/errorHandling/asyncHandler.js";
import { roleType } from "../DB/models/user.model.js";
import { verify } from "./../utils/token/token.js";
import UserModel from "../DB/models/user.model.js";

export const tokenTypes = {
  access: "access",
  refresh: "refresh",
};

export const decodedToken = async ({
  authorization = "",
  tokenType = tokenTypes.access,
  next = {},
}) => {
  const [bearer, token] = authorization.split(" ") || [];
  if (!bearer || !token)
    return next(new Error("in-valid Token", { cause: 401 }));

  let ACCESS_SIGNATURE = undefined;
  let REFRESH_SIGNATURE = undefined;

  switch (bearer) {
    case roleType.User:
      ACCESS_SIGNATURE = process.env.USER_ACCESS_TOKEN;
      REFRESH_SIGNATURE = process.env.USER_REFRESH_TOKEN;
      break;
    case roleType.Admin:
    case roleType.SuperAdmin:
      ACCESS_SIGNATURE = process.env.ADMIN_ACCESS_TOKEN;
      REFRESH_SIGNATURE = process.env.ADMIN_REFRESH_TOKEN;
      break;
    default:
      break;
  }

  const decoded = verify({
    token: token,
    signature:
      tokenType == tokenTypes.access ? ACCESS_SIGNATURE : REFRESH_SIGNATURE,
  });
  const user = await dbService.findOne({
    model: UserModel,
    filter: { _id: decoded.id, isDeleted: false },
  });
  if (!user) return next(new Error("User not Found", { cause: 404 }));

  if (user.changeCredentailsTime?.getTime() >= decoded.iat * 1000) {
    return next(
      new Error("In-valid Token, please login again", { cause: 401 })
    );
  }
  return user;
};

export const authentication = () => {
  return asyncHandler(async (req, res, next) => {
    const { authorization } = req.headers;
    req.user = await decodedToken({ authorization, next });
    return next();
  });
};

export const allowTo = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new Error("You are not allowed!!", 403));
    }
    return next();
  });
};
