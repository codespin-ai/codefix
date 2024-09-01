import { Request, Response } from "express";
import { sendMessageToApp } from "./appManager.js";

export function sendToIDE(req: Request, res: Response) {
  const { type, projectPath, filePath, contents } = req.body;

  if (!type || !projectPath || !filePath || !contents) {
    return res.status(400).json({
      error: "type, projectPath, filePath, and contents are required",
    });
  }

  const message = { type, filePath, contents };

  console.log({
    message,
  });
  
  sendMessageToApp(projectPath, message);

  res.json({ result: "message sent to IDE" });
}
