import { Request, Response } from "express";
import { registeredApps } from "./appManager.js";

export function keepAlive(req: Request, res: Response) {
  const { projectPath } = req.body;

  if (!projectPath) {
    return res.status(400).json({ error: "projectPath is required" });
  }

  let registration = registeredApps.get(projectPath);

  if (!registration) {
    registration = {
      timestamp: Date.now(),
    };
    registeredApps.set(projectPath, registration);
  } else {
    registration.timestamp = Date.now();
  }

  res.json({ result: "keepalive received" });
}
