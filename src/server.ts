import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { Server } from "http";
import { keyValidationMiddleware } from "./middleware/keyValidation.js";
import { getFileContentHandler } from "./routes/files/getFileContent.js";
import { getFilesHandler } from "./routes/files/getFiles.js";
import { writeFileHandler } from "./routes/files/writeFile.js";
import { loadSettings } from "./settings.js";
import { killHandler } from "./routes/kill.js";

let server: Server | null = null;
let isStarted = false;
const settings = await loadSettings();
const { port, key: secretKey } = settings;

export async function startServer(projectPath: string) {
  if (isStarted) return; // Prevent re-starting the server

  const app = express();

  // CORS configuration
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
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Access-Control-Allow-Private-Network",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  app.use(bodyParser.json()); // Enable JSON parsing

  // Key validation middleware
  app.use(keyValidationMiddleware(secretKey));

  // File listing and creation routes
  app.get("/files", (req, res) => {
    getFilesHandler(req, res, projectPath);
  });
  app.post("/files", (req, res) => {
    writeFileHandler(req, res, projectPath);
  });
  app.get("/files/*", (req, res) => {
    getFilesHandler(req, res, projectPath);
  });
  app.post("/files/*", (req, res) => {
    writeFileHandler(req, res, projectPath);
  });

  // File Contents
  app.get("/file-content/*", (req, res) => {
    getFileContentHandler(req, res, projectPath);
  });

  // Kill
  app.get("/kill", (req, res) => {
    killHandler(req, res);
  });

  // Start server
  server = app.listen(port, () => {
    console.log(`Started codefix server on port ${port}.`);
    isStarted = true;
  });
}

// Function to terminate the server
export function terminateServer() {
  if (server) {
    server.close(() => {
      isStarted = false;
      console.log("Server has been terminated.");
      process.exit();
    });
  }
}
