import { Request, Response } from "express";
import * as fs from "fs/promises";
import * as path from "path";
import * as ignoreModule from "ignore"; // Import default callable function
import { Ignore } from "ignore";
import { makeError, makeResult } from "../../Result.js";

// Utility function to recursively list files
async function getDirectoryContentsRecursive(
  directory: string,
  ig: Ignore
): Promise<any[]> {
  const items = await fs.readdir(directory, { withFileTypes: true });

  const contents = await Promise.all(
    items.map(async (item) => {
      const itemPath = path.join(directory, item.name);

      // Check if path is ignored
      if (ig.ignores(path.relative(directory, itemPath))) {
        return null;
      }

      const itemStats = await fs.stat(itemPath);

      if (itemStats.isDirectory()) {
        // Recursively get contents of subdirectory
        return {
          type: "dir",
          name: item.name,
          contents: await getDirectoryContentsRecursive(itemPath, ig),
        };
      } else {
        // File entry
        return {
          type: "file",
          name: item.name,
          length: itemStats.size,
        };
      }
    })
  );

  // Filter out null results (ignored files)
  return contents.filter(Boolean);
}

export async function getFilesHandler(
  req: Request,
  res: Response,
  projectId: string,
  projectPath: string
) {
  const { id } = req.params;

  if (!id || id !== projectId) {
    return res.status(400).json(makeError("INVALID_PROJECT_ID"));
  }

  const filePath = req.params[0]; // Path after /files/
  const fullPath = path.join(projectPath, filePath);

  if (!fullPath.startsWith(projectPath)) {
    return res.status(400).json(makeError("INVALID_PATH"));
  }

  try {
    // Load and parse .gitignore if it exists
    const gitignorePath = path.join(projectPath, ".gitignore");
    const ig = ignoreModule.default(); // Create an instance of ignore

    try {
      const gitignoreContents = await fs.readFile(gitignorePath, "utf-8");
      ig.add(gitignoreContents); // Add the .gitignore rules to the ignore instance
    } catch (err) {
      // If no .gitignore file exists, just proceed
    }

    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      // Recursively list the contents of the directory
      const contents = await getDirectoryContentsRecursive(fullPath, ig);
      res.json(makeResult({ type: "dir", contents }));
    } else {
      // If it's a file, read and return its contents
      const fileContents = await fs.readFile(fullPath, "utf-8");
      res.json(
        makeResult({
          type: "file",
          name: path.basename(fullPath),
          contents: fileContents,
          length: stats.size, // Add file length (size in bytes)
        })
      );
    }
  } catch (err) {
    res.status(500).json(makeError("UNABLE_TO_READ_PATH"));
  }
}
