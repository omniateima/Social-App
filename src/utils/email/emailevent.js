import { EventEmitter } from "events";
import { customAlphabet } from "nanoid";
import sendEmail, { subjects } from "./sendEmail.js";
import { hash } from "./../hashing/hash.js";
import UserModel from "./../../DB/models/user.model.js";
import { templete } from "./generateHtml.js";
import * as dbService from "./../../DB/dbService.js";

export const emailEmitter = new EventEmitter();

emailEmitter.on("sendEmail", async (email, userName, id="") => {
  await sendCode({
    data: { email, userName, id },
    subject: subjects.verifyEmail,
  });
});

emailEmitter.on("sendResetPasswordEmail", async (email, userName, id="") => {
  await sendCode({
    data: { email, userName, id },
    subject: subjects.resetPassword,
  });
});

emailEmitter.on("sendUpdateEmail", async (email, userName, id="") => {
  await sendCode({
    data: { email, userName, id },
    subject: subjects.updateEmail,
  });
});

emailEmitter.on("sendEnable2SVEmail", async (email, userName, id="") => {
  await sendCode({
    data: { email, userName, id },
    subject: subjects.enable2SV,
  });
});

export const sendCode = async ({
  data = {},
  subject = subjects.verifyEmail,
}) => {
  const { userName, email, id } = data;
  const otp = customAlphabet("0123456789", 6)();
  const hashOTP = hash({ plainText: otp });
  let updateData = {};
  switch (subject) {
    case subjects.verifyEmail:
    case subjects.enable2SV:
      updateData = { confirmEmailOTP: hashOTP };
      break;
    case subjects.resetPassword:
      updateData = { forgetPasswordOTP: hashOTP };
      break;
    case subjects.updateEmail:
      updateData = { tempEmailOTP: hashOTP };
      break;
    default:
      break;
  }
  const otpExpire = new Date();
  otpExpire.setMinutes(otpExpire.getMinutes() + 2);
  updateData.otpExpire = otpExpire;

  id
    ? await dbService.updateOne({
        model: UserModel,
        filter: { _id: id },
        data: updateData,
      })
    : await dbService.updateOne({
        model: UserModel,
        filter: { email },
        data: updateData,
      });

  await sendEmail({
    to: email,
    subject: subject,
    html: templete(otp, userName, subject),
  });
};

export const checkCodeAttempts = async ({ user, code, next }) => {
  if (user.otpAttempts === 0 && !user.otpAttemptsWait) {
    //no more attemps
    const otpAttemptsWait = new Date();
    otpAttemptsWait.setMinutes(otpAttemptsWait.getMinutes() + 5);
    user.otpAttemptsWait = otpAttemptsWait;
    await user.save();
    return next(new Error("try again after 5 minute!", { cause: 401 }));
  }

  if (user.otpAttemptsWait) {
    //not equal null
    if (user.otpAttemptsWait > Date.now()) {
      const now = new Date();
      const minutes = now.getMinutes();
      const remainMinutes = user.otpAttemptsWait.getMinutes() - minutes;
      return next(
        new Error(`Please wait ${remainMinutes} minutes and try again!`, {
          cause: 401,
        })
      );
    } else {
      user.otpAttemptsWait = null;
      user.otpAttempts = 5;
      await user.save();
    }
  }

};
