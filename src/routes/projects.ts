import { Request, Response } from "express";
import { getRandomId } from "../utils/getRandomId.js";

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

function addProject({ path }: { path: string }) {
  // Add the new project if it doesn't already exist
  const projectId = getRandomId();
  const project = { id: projectId, path };
  projects.push(project);
  return project;
}

// Add a new project
export function handleAddProject(req: Request, res: Response) {
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ error: "Invalid project path" });
  }

  // Check if the project path is already being served
  const existingProject = projects.find((project) => project.path === path);

  if (existingProject) {
    res.status(201).json(existingProject);
  } else {
    const project = addProject(path);
    res.status(201).json(project);
  }
}

export function handleGetProjects(req: Request, res: Response) {
  res.json(projects);
}
