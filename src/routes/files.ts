import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export function handleWriteFile(
  req: Request,
  res: Response,
  projectId: string,
  projectPath: string,
  secretKey: string
) {
  const { id } = req.params;
  const { contents } = req.body;
  const { key } = req.query;

  if (key !== secretKey) return res.status(401).json({ error: "Unauthorized" });

  if (!id || id !== projectId)
    return res.status(400).json({ error: "Invalid project id" });

  const filePath = req.params[0]; // For path after /files/
  const fullPath = path.join(projectPath, filePath);

  if (!fullPath.startsWith(projectPath))
    return res.status(400).json({ error: "Invalid file path" });

  fs.writeFileSync(fullPath, contents, "utf-8");
  res.json({ result: "File written successfully" });
}
