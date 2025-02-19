import { Router } from "express";
import * as authService from "./auth.service.js";
import { validation } from "../../middlewares/validation.middleware.js";
import * as authValidation from "./auth.validation.js";

const router = Router();

router.post(
  "/register",
  validation(authValidation.registerSchema),
  authService.register
);

router.post(
  "/login",
  validation(authValidation.loginSchema),
  authService.login
);

router.post(
  "/loginConfirmation",
  validation(authValidation.loginConfirmationSchema),
  authService.loginConfirmation
);

router.get("/refresh_token", authService.refreshToken);

router.patch(
  "/verify-email",
  validation(authValidation.confirmEmailSchema),
  authService.confirmEmail
);

router.patch(
  "/forget-password",
  validation(authValidation.forgetPasswordSchema),
  authService.forgetPassword
);

router.patch(
  "/reset-password",
  validation(authValidation.resetPasswordSchema),
  authService.resetPassword
);

router.post("/loginWithGmail", authService.loginWithGmail);

export default router;
