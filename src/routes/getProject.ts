import { Request, Response } from "express";

export function handleGetProject(
  req: Request,
  res: Response,
  projectId: string
) {
  const { id } = req.params;

  if (!id || id !== projectId) {
    return res.status(400).json({ error: "Invalid id" });
  }

  res.json({ result: "ok" });
}
