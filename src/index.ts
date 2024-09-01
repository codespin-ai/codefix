#!/usr/bin/env node

import bodyParser from "body-parser";
import express from "express";
import cors from "cors"; // Import cors
import { Server } from "http";
import { fileURLToPath } from "url";
import { keepAlive } from "./handlers/keepAlive.js";
import { getProjects, register } from "./handlers/register.js";
import { sendToIDE } from "./handlers/sendToIDE.js";
import { setupWebSocket } from "./webSocket.js";

let server: Server | null = null;
let isStarted = false;

const PORT = 60280;

export async function start(invokedViaCLI = false) {
  if (isStarted) {
    return;
  }

  const app = express();

  // Configure CORS
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
      allowedHeaders: ["Access-Control-Allow-Private-Network"],
    })
  );

  // Set Access-Control-Allow-Private-Network header
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Private-Network", "true");
    next();
  });

  app.use(bodyParser.json());
  app.post("/keepalive", keepAlive);
  app.post("/send-to-ide", sendToIDE);
  app.post("/register", register);
  app.get("/projects", getProjects);

  try {
    server = app.listen(PORT, () => {
      isStarted = true;
      console.log(`Server is running on port ${PORT}`);
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
  start(true);
}
