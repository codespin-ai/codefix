import { Request, Response } from "express";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  16
);

interface Project {
  id: string;
  path: string;
}

let projects: Project[] = []; // Array to hold project data

// Function to get the current list of projects
export function getProjects(): Project[] {
  return projects;
}

// Function to set the projects (to be used in server.ts)
export function setProjects(newProjects: Project[]) {
  projects = newProjects;
}

// Add a new project
export function handleAddProject(req: Request, res: Response) {
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ error: "Invalid project path" });
  }

  const projectId = nanoid();
  const newProject = { id: projectId, path };
  projects.push(newProject);

  res.status(201).json(newProject);
}

// Get all projects (requires valid secret key)
export function handleGetProjects(
  req: Request,
  res: Response,
  secretKey: string
) {
  const { key } = req.query;
  if (key !== secretKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(projects);
}
