import { Request, Response } from "express";
import { Project } from "./types.js";
import { makeResult } from "../Result.js";

let projects: Project[] = []; // Array to hold project data

// Function to get the current list of projects
export function getProjects(): Project[] {
  return projects;
}

export function getProjectsHandler(req: Request, res: Response) {
  res.json(makeResult(projects));
}
