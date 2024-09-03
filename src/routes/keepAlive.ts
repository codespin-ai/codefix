import { Request, Response } from "express";

let lastKeepAlive: number | null = null;

export function handleKeepAlive(
  req: Request,
  res: Response,
  projectId: string
) {
  const { id } = req.params;

  if (!id || id !== projectId) {
    return res.status(400).json({ error: "Invalid id" });
  }
  lastKeepAlive = Date.now();
  res.json({ result: "keepalive received" });
}

export { lastKeepAlive };
