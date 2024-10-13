import { Request, Response } from "express";
import * as fs from "fs/promises";
import * as path from "path";
import * as ignoreModule from "ignore";
import { Ignore } from "ignore";
import { makeError, makeResult } from "../Result.js";

async function getDirectoryContentsRecursive(
  directory: string,
  ig: Ignore,
  projectPath: string
): Promise<any[]> {
  const items = await fs.readdir(directory, { withFileTypes: true });

  const contents = await Promise.all(
    items.map(async (item) => {
      const itemPath = path.join(directory, item.name);
      const relativePath = path
        .relative(projectPath, itemPath)
        .split(path.sep)
        .join("/");

      if (relativePath === ".git" || relativePath.startsWith(".git/")) {
        return null;
      }

      if (ig.ignores(relativePath)) {
        return null;
      }

      const itemStats = await fs.stat(itemPath);

      if (itemStats.isDirectory()) {
        return {
          type: "dir",
          name: item.name,
          contents: await getDirectoryContentsRecursive(
            itemPath,
            ig,
            projectPath
          ),
        };
      } else {
        return {
          type: "file",
          name: item.name,
          length: itemStats.size,
        };
      }
    })
  );

  return contents.filter(Boolean);
}

export async function getFilesHandler(
  req: Request,
  res: Response,
  projectPath: string
) {
  const filePath = req.params[0];
  const fullPath = path.join(projectPath, filePath);

  if (!path.resolve(fullPath).startsWith(path.resolve(projectPath))) {
    return res.status(400).json(makeError("INVALID_PATH"));
  }

  try {
    const gitignorePath = path.join(projectPath, ".gitignore");
    const ig = ignoreModule.default();

    try {
      const gitignoreContents = await fs.readFile(gitignorePath, "utf-8");
      ig.add(gitignoreContents);
    } catch (err) {
      // If no .gitignore exists, just proceed
    }

    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      const contents = await getDirectoryContentsRecursive(
        fullPath,
        ig,
        projectPath
      );
      res.json(makeResult({ type: "dir", contents }));
    } else {
      const fileContents = await fs.readFile(fullPath, "utf-8");
      res.json(
        makeResult({
          type: "file",
          name: path.basename(fullPath),
          contents: fileContents,
          length: stats.size,
        })
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(makeError("UNABLE_TO_READ_PATH"));
  }
}
