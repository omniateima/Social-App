import mongoose, { Schema, Types, model } from "mongoose";
import { hash } from "../../utils/hashing/hash.js";

export const genderType = {
  male: "male",
  female: "female",
};
export const roleType = {
  SuperAdmin: "SuperAdmin",
  Admin: "Admin",
  User: "User",
};

export const providers = {
  Google: "Google",
  System: "System",
};

export const defaultImage = "./../../upload/default-profile.jpg";

export const defaultImgUrlCloud =
  "https://res.cloudinary.com/dk6a3kvwg/image/upload/v1738928849/default-profile-icon-16_rb7aj9.png";

export const defaultImgPublicIdCloud = "default-profile-icon-16_rb7aj9";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      minLength: [3, "User name must be at least 3 characters long"],
      maxLength: [30, "User name must be at most 30 characters long"],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/,
    },
    password: String,
    enable2SV: {
      type: Boolean,
      default: false,
    },
    phone: String,
    address: String,
    DOB: Date,
    imagecloud: {
      secure_url: {
        type: String,
        default: defaultImgUrlCloud,
      },
      public_id: {
        type: String,
        default: defaultImgPublicIdCloud,
      },
    },
    image: {
      type: String,
      default: defaultImage,
    },
    coverImages: [String],
    gender: {
      type: String,
      enum: {
        values: Object.values(genderType),
        message: "value is not supported",
        default: genderType.male,
      },
    },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(roleType),
        message: "value is not supported",
      },
      default: roleType.User,
    },
    isDeleted: { type: Boolean, default: false },
    providers: {
      type: String,
      enum: Object.values(providers),
      default: providers.System,
    },
    confirmEmailOTP: String,
    forgetPasswordOTP: String,
    changeCredentailsTime: Date,
    viewers: [
      {
        userId: { type: Types.ObjectId, ref: "User" },
        time: Date,
        visitCount: { type: Number, default: 1 },
      },
    ],
    blockedUsers: [{ type: Types.ObjectId, ref: "User" }],
    tempEmail: String,
    tempEmailOTP: String,
    otpExpire: Date,
    otpAttempts: {
      type: Number,
      default: 5,
    },
    otpAttemtpsWait: Date,
    friendRequests: [{ type: Types.ObjectId, ref: "User" }],
    friends: [{ type: Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    this.password = hash({ plainText: this.password });
  }
  return next();
});

const UserModel = mongoose.model.User || model("User", userSchema);
export default UserModel;
