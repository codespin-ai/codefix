import { Request, Response } from "express";
import { getProjects } from "./getProjects.js";
import { makeError, makeResult } from "../Result.js";

export function addProject({ path }: { path: string }) {
  // Add the new project if it doesn't already exist
  const projects = getProjects();
  const project = { path: path.replace(/\/$/, "") };
  projects.push(project);
  return project;
}

// Add a new project
export function addProjectHandler(req: Request, res: Response) {
  const { path } = req.body;
  if (!path) {
    return res.status(400).json(makeError("INVALID_PATH"));
  }

  // Check if the project path is already being served
  const existingProject = getProjects().find(
    (project) => project.path === path
  );

  if (existingProject) {
    res.status(201).json(makeResult(existingProject));
  } else {
    const project = addProject(path);
    res.status(201).json(makeResult(project));
  }
}
