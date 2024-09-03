import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { projectPath } from "../server.js";

export function handleWrite(req: Request, res: Response, projectId: string) {
  const { id } = req.params;
  const { type, filePath, contents } = req.body;

  if (!id || id !== projectId) {
    return res.status(400).json({ error: "Invalid id" });
  }

  if (!projectPath) {
    return res.status(400).json({ error: "Invalid project path" });
  }

  const fullPath = path.join(projectPath, filePath);

  if (!fullPath.startsWith(projectPath)) {
    return res.status(400).json({ error: "Invalid filePath" });
  }

  if (type !== "code") {
    return res.status(400).json({ error: "Invalid type" });
  }

  fs.writeFileSync(fullPath, contents, "utf-8");
  res.json({ result: "File written successfully" });
}
