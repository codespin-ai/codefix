import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { Server } from "http";
import { killHandler } from "./routes/kill.js";
import { loadSettings } from "./settings.js";
import * as fs from "fs/promises";
import { keyValidationMiddleware } from "./middleware/keyValidation.js";
import { getRandomId } from "./utils/getRandomId.js";
import { addProject, addProjectHandler } from "./routes/projects/addProject.js";
import {
  getProjects,
  getProjectsHandler,
} from "./routes/projects/getProjects.js";
import { getFilesHandler } from "./routes/projects/files/getFiles.js";
import { writeFileHandler } from "./routes/projects/files/writeFile.js";
import { makeError, makeResult } from "./routes/Result.js";

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
      allowedHeaders: ["Content-Type", "Access-Control-Allow-Private-Network"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  app.use(bodyParser.json()); // Enable JSON parsing

  // Validate the key param
  app.use(keyValidationMiddleware(secretKey));

  // Routes
  app.post("/projects", (req, res) => addProjectHandler(req, res)); // Add new project
  app.get("/projects", (req, res) => getProjectsHandler(req, res)); // Get all projects
  app.get("/projects/:id/files/*", (req, res) => {
    const projectId = req.params.id;
    const projectPath = getProjectPath(projectId); // Fetch project path based on project ID
    getFilesHandler(req, res, projectId, projectPath); // Handle file retrieval
  });
  app.post("/projects/:id/files/*", (req, res) => {
    const projectId = req.params.id;
    const projectPath = getProjectPath(projectId); // Fetch project path based on project ID
    writeFileHandler(req, res, projectId, projectPath); // Handle file write
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

// Function to retrieve the project path by its ID
function getProjectPath(projectId: string): string {
  const project = getProjects().find((p) => p.id === projectId);
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found.`);
  }
  return project.path;
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
