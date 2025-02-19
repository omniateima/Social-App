import fs from "fs";
import path from "path";
import multer, { diskStorage } from "multer";
import { nanoid } from "nanoid";



export const fileValidation = {
  images: ["image/png", "image/jpg", "image/jpeg"],
  files: ["application/pdf"],
  videos: ["video/mp4"],
  audios: ["audio/mpeg"],
};

export const upload = (allowedFileTypes, folder) => {
  //diskStorage
  const storage = diskStorage({
    destination: (req, file, cb) => {
      const folderPath = path.resolve(".", `${folder}/${req.user._id}`);
      // check if folder exist if not create it
      if (fs.existsSync(folderPath)) {
        return cb(null, folderPath);
      } else {
        fs.mkdirSync(folderPath, { recursive: true });
        const filename = `${folder}/${req.user._id}`;
        cb(null, filename);
      }
    },
    filename: (req, file, cb) => {
      cb(null, nanoid(8) + "__" + file.originalname);
    },
  });

  const fileFilter = async (req, file, cb) => {
    if (!allowedFileTypes.includes(file.mimetype))
      return cb(new Error("in-valid file type"), false);
    return cb(null, true);
  };

  //multer
  const multerUpload = multer({ storage, fileFilter });
  return multerUpload; // Object
};
