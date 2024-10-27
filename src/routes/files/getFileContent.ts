import { Request, Response } from "express";
import * as fs from "fs/promises";
import * as path from "path";
import { makeError, makeResult } from "../Result.js";

export async function getFileContentHandler(
  req: Request,
  res: Response,
  projectPath: string
) {
  const filePath = req.params[0] ? req.params[0] : "";
  const fullPath = path.join(projectPath, filePath);

  // Ensure the requested path is within the project directory
  if (!path.resolve(fullPath).startsWith(path.resolve(projectPath))) {
    return res.status(400).json(makeError("PATH_OUTSIDE_PROJECT"));
  }

  try {
    const stats = await fs.stat(fullPath);

    if (!stats.isFile()) {
      // Return an error if the path is not a file
      return res
        .status(400)
        .json(makeError("NOT_A_FILE", "Requested path is not a file."));
    }

    // Read the file content
    const fileContents = await fs.readFile(fullPath, "utf-8");
    res.json(
      makeResult({
        type: "file",
        filename: path.basename(fullPath),
        path: fullPath,
        contents: fileContents,
        size: stats.size,
      })
    );
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(makeError("UNABLE_TO_READ_FILE", "Unable to read file content."));
  }
}
