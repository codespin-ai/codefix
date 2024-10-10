import { Request, Response } from "express";
import { terminateServer } from "../server.js"; // Import the terminateServer function

export function handleKill(req: Request, res: Response, secretKey: string) {
  const { key } = req.query;
  if (key !== secretKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ message: "Server is shutting down..." });
  terminateServer(); // Terminate the server after sending the response
}
