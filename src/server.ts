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
import { loadSettings } from "./settings.js";

let server: Server | null = null;
let isStarted = false;
const settings = await loadSettings(); // Load settings (e.g., port, secret key)
const { port, key: secretKey } = settings;

export async function startServer(initialProjectPath: string) {
  if (isStarted) return; // Prevent re-starting the server

  const app = express();

  // Define CORS configuration
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

  // Routes
  app.post("/projects", (req, res) => handleAddProject(req, res)); // Add new project
  app.get("/projects", (req, res) => handleGetProjects(req, res, secretKey)); // Get all projects
  app.get("/projects/:id/files/*", (req, res) => {
    const projectId = req.params.id;
    const projectPath = getProjectPath(projectId); // Fetch project path based on project ID
    handleGetFile(req, res, projectId, projectPath, secretKey); // Handle file retrieval
  });
  app.post("/projects/:id/files/*", (req, res) => {
    const projectId = req.params.id;
    const projectPath = getProjectPath(projectId); // Fetch project path based on project ID
    handleWriteFile(req, res, projectId, projectPath, secretKey); // Handle file write
  });

  // Add the /kill endpoint
  app.post("/kill", (req, res) => {
    const { key } = req.query;
    if (key !== secretKey) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({ message: "Server is shutting down..." });
    terminateServer();
  });

  // Start server
  server = app.listen(port, () => {
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
  const projectId = "INITIAL_PROJECT_ID"; // Generate a unique ID
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
      console.log("Server has been terminated");
      process.exit();
    });
  }
}
