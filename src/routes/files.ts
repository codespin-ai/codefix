import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";

export async function handleWriteFile(
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

  try {
    await fs.writeFile(fullPath, contents, "utf-8");
    res.json({ result: "File written successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to write file" });
  }
}

export async function handleGetFile(
  req: Request,
  res: Response,
  projectId: string,
  projectPath: string,
  secretKey: string
) {
  const { id } = req.params;
  const { key } = req.query;

  if (key !== secretKey) return res.status(401).json({ error: "Unauthorized" });

  if (!id || id !== projectId)
    return res.status(400).json({ error: "Invalid project id" });

  const filePath = req.params[0]; // Path after /files/
  const fullPath = path.join(projectPath, filePath);

  if (!fullPath.startsWith(projectPath))
    return res.status(400).json({ error: "Invalid file path" });

  try {
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      // If it's a directory, read the directory contents
      const items = await fs.readdir(fullPath);

      const contents = await Promise.all(
        items.map(async (item) => {
          const itemPath = path.join(fullPath, item);
          const itemStats = await fs.stat(itemPath);
          return {
            type: itemStats.isDirectory() ? "dir" : "file",
            name: item,
            length: itemStats.isDirectory() ? undefined : itemStats.size, // For files, add length (size in bytes)
          };
        })
      );

      res.json({ type: "dir", contents });
    } else {
      // If it's a file, read the file contents
      const fileContents = await fs.readFile(fullPath, "utf-8");
      res.json({
        type: "file",
        name: path.basename(fullPath),
        contents: fileContents,
        length: stats.size, // Add file length (size in bytes)
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to read file or directory" });
  }
}
