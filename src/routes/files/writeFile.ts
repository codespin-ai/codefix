import { Request, Response } from "express";
import * as fs from "fs/promises";
import * as path from "path";
import { makeError, makeResult } from "../Result.js";

export async function writeFileHandler(
  req: Request,
  res: Response,
  projectPath: string
) {
  const { contents } = req.body;
  const filePath = req.params[0] ? req.params[0] : "";
  const fullPath = path.join(projectPath, filePath);

  if (!fullPath.startsWith(projectPath)) {
    return res.status(400).json(makeError("PATH_OUTSIDE_PROJECT"));
  }

  try {
    await fs.writeFile(fullPath, contents, "utf-8");
    res.json(makeResult({ message: "File written successfully" }));
  } catch (err) {
    res.status(500).json(makeError("CANNOT_WRITE_FILE"));
  }
}
