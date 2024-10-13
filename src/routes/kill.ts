import { Request, Response } from "express";
import { terminateServer } from "../server.js"; // Import the terminateServer function

export function handleKill(req: Request, res: Response) {
  res.json({ message: "Server is shutting down..." });
  terminateServer(); // Terminate the server after sending the response
}
