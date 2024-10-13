import { Request, Response } from "express";
import * as fs from "fs/promises";
import * as path from "path";
import * as ignoreModule from "ignore"; // Import default callable function
import { Ignore } from "ignore";
import { makeError, makeResult } from "../../Result.js";

// Utility function to recursively list files
async function getDirectoryContentsRecursive(
  directory: string,
  ig: Ignore,
  projectPath: string // Added projectPath parameter
): Promise<any[]> {
  const items = await fs.readdir(directory, { withFileTypes: true });

  const contents = await Promise.all(
    items.map(async (item) => {
      const itemPath = path.join(directory, item.name);
      const relativePath = path
        .relative(projectPath, itemPath)
        .split(path.sep)
        .join("/"); // Normalize to POSIX paths

      // **Programmatically exclude .git directory**
      if (relativePath === ".git" || relativePath.startsWith(".git/")) {
        return null;
      }

      // Check if path is ignored by .gitignore
      if (ig.ignores(relativePath)) {
        return null;
      }

      const itemStats = await fs.stat(itemPath);

      if (itemStats.isDirectory()) {
        // Recursively get contents of subdirectory
        return {
          type: "dir",
          name: item.name,
          contents: await getDirectoryContentsRecursive(
            itemPath,
            ig,
            projectPath
          ), // Pass projectPath down
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

export async function getFilesHandler(req: Request, res: Response) {
  const projectPath = req.query.project as string;

  if (!projectPath) {
    return res.status(400).json(makeError("MISSING_PROJECT_PATH"));
  }

  const filePath = req.params[0]; // Path after /files/
  const fullPath = path.join(projectPath, filePath);

  // Prevent directory traversal
  if (!path.resolve(fullPath).startsWith(path.resolve(projectPath))) {
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
      const contents = await getDirectoryContentsRecursive(
        fullPath,
        ig,
        projectPath
      ); // Pass projectPath
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
    console.error(err); // Log the error for debugging purposes
    res.status(500).json(makeError("UNABLE_TO_READ_PATH"));
  }
}
