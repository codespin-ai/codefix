import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import * as fs from "fs/promises";
import { Server } from "http";
import { keyValidationMiddleware } from "./middleware/keyValidation.js";
import { killHandler } from "./routes/kill.js";
import { addProject, addProjectHandler } from "./routes/projects/addProject.js";
import { getFilesHandler } from "./routes/projects/files/getFiles.js";
import { writeFileHandler } from "./routes/projects/files/writeFile.js";
import { getProjectsHandler } from "./routes/projects/getProjects.js";
import { makeError, makeResult } from "./routes/Result.js";
import { loadSettings } from "./settings.js";

let server: Server | null = null;
let isStarted = false;
const settings = await loadSettings(); // Load settings (e.g., port, secret key)
const { port, key: secretKey } = settings;

let cachedVersion: string | null = null; // Cache for the version

export async function startServer(initialProjectPath: string) {
  if (isStarted) return; // Prevent re-starting the server

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
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Access-Control-Allow-Private-Network",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  app.use(bodyParser.json()); // Enable JSON parsing

  // Validate the key param
  app.use(keyValidationMiddleware(secretKey));

  // Projects
  app.get("/projects", (req, res) => getProjectsHandler(req, res));
  app.post("/projects", (req, res) => addProjectHandler(req, res));

  // Files
  app.get("/files/*", (req, res) => {
    getFilesHandler(req, res);
  });
  app.post("/files/*", (req, res) => {
    writeFileHandler(req, res);
  });

  // Add the /kill endpoint
  app.post("/kill", (req, res) => killHandler(req, res)); // Move /kill to route

  // Add the /about endpoint
  app.get("/about", async (req, res) => {
    if (!cachedVersion) {
      try {
        const packageJson = await fs.readFile("./package.json", "utf-8");
        const { version } = JSON.parse(packageJson);
        cachedVersion = version; // Cache the version after reading
      } catch (error) {
        return res.status(500).json(makeError("CANNOT_LOAD_VERSION"));
      }
    }
    res.json(makeResult({ version: cachedVersion }));
  });

  // Start server
  server = app.listen(port, () => {
    console.log(`Started codefix server on port ${settings.port ?? 60280}.`);
    isStarted = true;
    // On first run, add the initial project passed as argument
    if (initialProjectPath) {
      addInitialProject(initialProjectPath);
    }
  });
}

// Function to handle initial project on server start
function addInitialProject(initialProjectPath: string) {
  addProject({
    path: initialProjectPath,
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
