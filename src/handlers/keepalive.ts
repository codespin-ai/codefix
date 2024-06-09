import { Request, Response } from "express";
import { registeredApps } from "./appManager.js";

export const keepAlive = (req: Request, res: Response) => {
  const { workspaceRoot } = req.body;
  
  if (!workspaceRoot) {
    return res.status(400).json({ error: "workspaceRoot is required" });
  }

  let registration = registeredApps.get(workspaceRoot);

  if (!registration) {
    registration = {
      timestamp: Date.now(),
    };
    registeredApps.set(workspaceRoot, registration);
  } else {
    registration.timestamp = Date.now();
  }

  res.json({ result: "keepalive received" });
};
