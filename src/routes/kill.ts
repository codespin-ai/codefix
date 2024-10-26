import { Request, Response } from "express";
import { terminateServer } from "../server.js";
import { makeResult } from "./Result.js";

export function killHandler(req: Request, res: Response) {
  console.log("yeahhh");
  res.json(makeResult({ message: "Server is shutting down..." }));
  terminateServer();
}
