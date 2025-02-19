import multer, { diskStorage } from "multer";
import { fileValidation } from "./multerUpload.js";

export const uploadCloud = (allowedFileTypes) => {
  const storage = diskStorage({});

  const fileFilter = async (req, file, cb) => {
    if (!allowedFileTypes.includes(file.mimetype))
      return cb(new Error("in-valid file type"), false);
    return cb(null, true);
  };

  let fileSize;
  switch (allowedFileTypes) {
    case fileValidation.images:
      fileSize = 5 * 1024 * 1024; //5mb
      break;
    case fileValidation.videos:
      fileSize = 20 * 1024 * 1024; //20mb
      break;
    default:
      break;
  }

  const multerUpload = multer({ storage, limits: { fileSize }, fileFilter });
  return multerUpload;
};
