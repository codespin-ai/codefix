import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { Server } from "http";
import { handleGetProject } from "./routes/getProject.js";
import { handleKeepAlive } from "./routes/keepAlive.js";
import { handleWrite } from "./routes/write.js";

let server: Server | null = null;
let isStarted = false;
let lastKeepAlive: number | null = null;
export let projectPath: string | null = null;

export async function startServer(
  port: number,
  projectId: string,
  autoExit: boolean
) {
  if (isStarted) return;

  const app = express();

  const allowedOrigins = [
    "https://chatgpt.com",
    "https://chat.openai.com",
    "https://claude.ai",
  ];

  app.use(
    cors({
      origin: (origin: any, callback: any) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      allowedHeaders: ["Content-Type", "Access-Control-Allow-Private-Network"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  app.use(bodyParser.json());

  // Routes
  app.get(`/project/:id`, (req, res) => handleGetProject(req, res, projectId));
  app.post(`/project/:id/keepalive`, (req, res) =>
    handleKeepAlive(req, res, projectId)
  );
  app.post(`/project/:id/write`, (req, res) =>
    handleWrite(req, res, projectId)
  );

  server = app.listen(port, () => {
    isStarted = true;
    console.log(`Server is running on port ${port}`);
  });

  if (autoExit) {
    setInterval(() => {
      if (lastKeepAlive && Date.now() - lastKeepAlive > 60000) {
        terminateServer();
      }
    }, 60000);
  }
}

export function terminateServer() {
  if (server) {
    server.close(() => {
      isStarted = false;
      console.log("Server has been terminated");
      process.exit();
    });
  }
}
