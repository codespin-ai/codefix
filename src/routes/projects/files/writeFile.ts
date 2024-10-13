import { Request, Response } from "express";
import * as fs from "fs/promises";
import * as path from "path";
import { makeError, makeResult } from "../../Result.js";

export async function writeFileHandler(
  req: Request,
  res: Response,
  projectId: string,
  projectPath: string
) {
  const { id } = req.params;
  const { contents } = req.body;

  if (!id || id !== projectId)
    return res.status(400).json(makeError("INVALID_PROJECT_ID"));

  const filePath = req.params[0]; // For path after /files/
  const fullPath = path.join(projectPath, filePath);

  if (!fullPath.startsWith(projectPath))
    return res.status(400).json(makeError("INVALID_PATH"));

  try {
    await fs.writeFile(fullPath, contents, "utf-8");
    res.json(makeResult({ message: "File written successfully" }));
  } catch (err) {
    res.status(500).json(makeError("CANNOT_WRITE_FILE"));
  }
}
