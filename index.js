import express from "express";
import bootstrap from "./src/app.controller.js";

import { runSocket } from "./src/modules/socketio/index.js";

const app = express();
const port = process.env.PORT;

bootstrap(app, express);

const server = app.listen(port, () => {
  console.log("listen to server successfully");
});

runSocket(server);
