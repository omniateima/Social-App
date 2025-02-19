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

const bootstrap = async (app, express) => {
  await connectDB();

  app.use(express.json());
  app.use("/uploads", express.static("uploads")); //to serve static files that in uploads so can seen in browser

  app.use(cors());
  app.use(morgan("dev"));

  app.get("/", (req, res) => res.send("Hello World!"));
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
