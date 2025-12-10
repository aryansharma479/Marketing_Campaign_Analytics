import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { verifyToken, type DecodedToken } from "./jwt";
import { z, ZodError } from "zod";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      user?: DecodedToken;
    }
  }
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.correlationId = (req.headers["x-correlation-id"] as string) || randomUUID();
  res.setHeader("X-Correlation-ID", req.correlationId);
  next();
}

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers["user-agent"]?.substring(0, 100),
    };
    
    if (res.statusCode >= 400) {
      console.error("[ERROR]", JSON.stringify(logData));
    } else {
      console.log("[INFO]", JSON.stringify(logData));
    }
  });
  
  next();
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "No authentication token provided",
      correlationId: req.correlationId,
    });
  }
  
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
      correlationId: req.correlationId,
    });
  }
  
  if (decoded.type !== "access") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid token type",
      correlationId: req.correlationId,
    });
  }
  
  const isBlacklisted = await storage.isTokenBlacklisted(token);
  if (isBlacklisted) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Token has been revoked",
      correlationId: req.correlationId,
    });
  }
  
  req.user = decoded;
  next();
}

export function roleMiddleware(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
        correlationId: req.correlationId,
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions",
        correlationId: req.correlationId,
      });
    }
    
    next();
  };
}

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "ValidationError",
          message: "Invalid request data",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
          correlationId: req.correlationId,
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "ValidationError",
          message: "Invalid query parameters",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
          correlationId: req.correlationId,
        });
      }
      next(error);
    }
  };
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error("[ERROR]", JSON.stringify({
    correlationId: req.correlationId,
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  }));
  
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "ValidationError",
      message: err.message,
      correlationId: req.correlationId,
    });
  }
  
  if (err.message.includes("not found") || err.message.includes("Not found")) {
    return res.status(404).json({
      error: "NotFound",
      message: err.message,
      correlationId: req.correlationId,
    });
  }
  
  if (err.message.includes("already exists") || err.message.includes("duplicate")) {
    return res.status(409).json({
      error: "Conflict",
      message: err.message,
      correlationId: req.correlationId,
    });
  }
  
  res.status(500).json({
    error: "InternalServerError",
    message: "An unexpected error occurred",
    correlationId: req.correlationId,
  });
}
