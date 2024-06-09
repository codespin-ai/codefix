// File: ./src/index.ts
import bodyParser from "body-parser";
import { fork } from "child_process";
import express, { Request, Response } from "express";
import { Server } from "http";
import { fileURLToPath } from "url";
import { sendMessageToApp } from "./handlers/appManager.js";
import { keepAlive } from "./handlers/keepalive.js";
import { setupWebSocket } from "./webSocket.js";

let server: Server | null = null;
let isStarted = false;

export async function start() {
  if (isStarted) {
    return;
  }

  const app = express();
  const port = 3000;

  app.use(bodyParser.json());
  app.post("/keepalive", keepAlive);

  app.post("/send", (req: Request, res: Response) => {
    const { workspaceRoot, message } = req.body;
    if (!workspaceRoot || !message) {
      return res
        .status(400)
        .json({ error: "workspaceRoot and message are required" });
    }

    sendMessageToApp(workspaceRoot, message);
    res.json({ result: "message sent" });
  });

  try {
    server = app.listen(port, () => {
      isStarted = true;
      console.log(`Server is running on port ${port}`);
      if (server !== null) {
        setupWebSocket(server);
      } else {
        throw new Error("Cannot upgrade to support WS; Server is null.");
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

export async function terminate() {
  if (server) {
    server.close(() => {
      isStarted = false;
      console.log("Server has been terminated");
      process.exit();
    });
  }
}

const __filename = fileURLToPath(import.meta.url);

if (import.meta.url === `file://${__filename}`) {
  start();
} else {
  if (process.argv[2] !== "child") {
    fork(__filename, ["child"]);
  } else {
    start();
  }
}
