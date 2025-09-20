import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// Extend Express Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userLoginId?: string;
    }
  }
}

interface JwtPayload {
  userId: number;
  loginId: string;
  iat: number;
  exp: number;
}

/**
 * JWT Authentication Middleware
 * 
 * Reads Authorization header in the format: "Bearer <token>"
 * Verifies the JWT token and attaches userId to req.userId
 * 
 * Usage:
 * import { authMiddleware } from "../middleware/authMiddleware";
 * router.get("/protected-route", authMiddleware, (req, res) => {
 *   // req.userId is now available
 *   res.json({ userId: req.userId });
 * });
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    // Check if the header starts with "Bearer "
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format. Use 'Bearer <token>'"
      });
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Attach user information to request object
    req.userId = decoded.userId;
    req.userLoginId = decoded.loginId;
    
    // Continue to the next middleware/route handler
    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token."
      });
    }
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token has expired."
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication."
    });
  }
};

/**
 * Optional Auth Middleware
 * 
 * Similar to authMiddleware but doesn't reject requests without tokens
 * Useful for routes that have different behavior for authenticated vs anonymous users
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without setting userId
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    // Try to verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userId = decoded.userId;
    req.userLoginId = decoded.loginId;
    
    next();
  } catch (error) {
    // If token is invalid, continue without setting userId
    // (Don't reject the request)
    next();
  }
};

export default authMiddleware;