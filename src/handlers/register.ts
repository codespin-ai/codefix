import { Request, Response } from "express";
import { registeredApps } from "./appManager.js";

export function register(req: Request, res: Response) {
  const { projectPath } = req.body;

  if (!projectPath) {
    return res.status(400).json({ error: "projectPath is required" });
  }

  registeredApps.set(projectPath, {
    timestamp: Date.now(),
  });

  res.json({ result: "project registered" });
}

export function getProjects(req: Request, res: Response) {
  const projects = Array.from(registeredApps.entries()).map(
    ([projectPath, registration]) => ({
      projectPath,
      timestamp: registration.timestamp,
    })
  );

  res.json(projects);
}
