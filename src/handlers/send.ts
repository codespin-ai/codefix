import { Request, Response } from "express";
import { sendMessageToApp } from "./appManager.js";

export function send(req: Request, res: Response) {
  const { workspaceRoot, message } = req.body;
  if (!workspaceRoot || !message) {
    return res
      .status(400)
      .json({ error: "workspaceRoot and message are required" });
  }

  sendMessageToApp(workspaceRoot, message);
  res.json({ result: "message sent" });
}
