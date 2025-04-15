import cors from "cors";
import connectDB from "./DB/connection.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./utils/errorHandling/globalErrorHandler.js";
import userRouter from "./modules/User/user.controller.js";
import authRouter from "./modules/Auth/auth.controller.js";
import postRouter from "./modules/Posts/post.controller.js";
import commentRouter from "./modules/Comment/comment.controller.js";
import adminRouter from "./modules/Admin/admin.controller.js";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  wsindowM: 2 * 60 * 1000, //2minutes
  limit: 3, //3 per 2 min
  handler: (req, res, next, options) => {
    return next(new Error(options.message, { cause: options.statusCode }));
  },
  skipFailedRequests: true,
  // skip: (req, res) => {
  //   return ["::1", "192.165.0.50"].includes("::1");
  // },
});

const bootstrap = async (app, express) => {
  await connectDB();

  app.use(express.json());
  app.use("/upload", express.static("upload")); //to serve static files that in upload so can seen in browser

  app.use(cors());
  app.use(morgan("dev"));
  app.use(limiter);

  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/post", postRouter);
  app.use("/comment", commentRouter);
  app.use("/admin", adminRouter);

  app.get("/", (req, res) => {
    res.json("Hello from social app!");
  });
  app.all("*", notFoundHandler);
  app.use(globalErrorHandler);
};

export default bootstrap;
