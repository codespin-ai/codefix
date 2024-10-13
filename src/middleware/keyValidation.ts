import { NextFunction, Request, Response } from "express";
import { makeError } from "../routes/Result.js";

export function keyValidationMiddleware(secretKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.query.key || req.headers.key;

    if (key !== secretKey) {
      return res.status(401).json(makeError("UNAUTHORIZED"));
    }

    next(); // If the key is valid, proceed to the next middleware or route handler
  };
}
