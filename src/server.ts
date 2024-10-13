import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { Server } from "http";
import {
  handleAddProject,
  handleGetProjects,
  setProjects,
  getProjects,
} from "./routes/projects.js";
import { handleWriteFile, handleGetFile } from "./routes/files.js";
import { handleKill } from "./routes/kill.js"; // Import the kill route handler
import { loadSettings } from "./settings.js";
import fs from "fs/promises";
import { keyValidationMiddleware } from "./middleware/keyValidation.js";
import { nanoid } from "nanoid";

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
  app.post("/projects", (req, res) => handleAddProject(req, res)); // Add new project
  app.get("/projects", (req, res) => handleGetProjects(req, res)); // Get all projects
  app.get("/projects/:id/files/*", (req, res) => {
    const projectId = req.params.id;
    const projectPath = getProjectPath(projectId); // Fetch project path based on project ID
    handleGetFile(req, res, projectId, projectPath); // Handle file retrieval
  });
  app.post("/projects/:id/files/*", (req, res) => {
    const projectId = req.params.id;
    const projectPath = getProjectPath(projectId); // Fetch project path based on project ID
    handleWriteFile(req, res, projectId, projectPath); // Handle file write
  });

  // Add the /kill endpoint
  app.post("/kill", (req, res) => handleKill(req, res)); // Move /kill to route

  // Add the /about endpoint
  app.get("/about", async (req, res) => {
    if (!cachedVersion) {
      try {
        const packageJson = await fs.readFile("./package.json", "utf-8");
        const { version } = JSON.parse(packageJson);
        cachedVersion = version; // Cache the version after reading
      } catch (error) {
        return res.status(500).json({ error: "Failed to load version" });
      }
    }
    res.json({ version: cachedVersion });
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
  // Get existing projects and add the initial one
  const currentProjects = getProjects();
  const projectId = nanoid();
  const updatedProjects = [
    ...currentProjects,
    { id: projectId, path: initialProjectPath },
  ];

  setProjects(updatedProjects); // Set the updated list of projects
}

// Function to retrieve the project path by its ID
function getProjectPath(projectId: string): string {
  const project = getProjects().find((p) => p.id === projectId);
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`);
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
