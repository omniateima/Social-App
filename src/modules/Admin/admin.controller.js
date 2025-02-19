import { Router } from "express";
import { allowTo, authentication } from "../../middlewares/auth.middleware.js";
import { validation } from "../../middlewares/validation.middleware.js";
import { roleType } from "../../DB/models/user.model.js";
import * as adminService from "./admin.service.js";
import { changeRoleSchema } from "./admin.validation.js";
import { changeRole } from "./admin.middleware.js";

const router = Router();

router.get(
  "/",
  authentication(),
  allowTo([roleType.Admin, roleType.SuperAdmin]),
  adminService.getAllUsersAndPosts
);

router.patch(
  "/role",
  authentication(),
  allowTo([roleType.Admin, roleType.SuperAdmin]),
  validation(changeRoleSchema),
  changeRole,
  adminService.changeRole
);

export default router;
