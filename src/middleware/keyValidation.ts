import { NextFunction, Request, Response } from "express";
import { makeError } from "../routes/Result.js";

export function keyValidationMiddleware(
  secretKey: string
): (req: Request, res: Response, next: NextFunction) => any {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const queryKey = req.query.key;

    let token: string | undefined;

    // If Authorization header is provided and starts with 'Bearer ', extract the token
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Check if the token from the header or the query key matches the secretKey
    if (token !== secretKey && queryKey !== secretKey) {
      return res.status(401).json(makeError("UNAUTHORIZED"));
    }

    next(); // If the token or query key is valid, proceed to the next middleware or route handler
  };
}
