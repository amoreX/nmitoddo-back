import { Request, Response } from "express";
import { signupService, loginService } from "../services/authService";

/**
 * Signup Controller
 * Expected input JSON:
 * {
 *   "loginId": "alice@example.com",
 *   "pwd": "alice",
 *   "name": "Alice Admin" // optional
 * }
 */
export const signupController = async (req: Request, res: Response) => {
  const { loginId, pwd, name } = req.body;

  // Validate required fields
  if (!loginId || !pwd) {
    return res.status(400).json({ 
      success: false,
      message: "LoginId and password are required." 
    });
  }

  // Basic loginId validation (can be email or username)
  if (loginId.length < 3) {
    return res.status(400).json({ 
      success: false,
      message: "LoginId must be at least 3 characters long." 
    });
  }

  // Password strength validation
  if (pwd.length < 6) {
    return res.status(400).json({ 
      success: false,
      message: "Password must be at least 6 characters long." 
    });
  }

  try {
    const result = await signupService(loginId, pwd, name);

    if (result.status) {
      return res.status(201).json({
        success: true,
        message: result.message,
        user: result.user,
        token: result.token
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error: any) {
    console.error("Signup controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Login Controller
 * Expected input JSON:
 * {
 *   "loginId": "alice@example.com",
 *   "pwd": "alice"
 * }
 */
export const loginController = async (req: Request, res: Response) => {
  const { loginId, pwd } = req.body;

  // Validate required fields
  if (!loginId || !pwd) {
    return res.status(400).json({ 
      success: false,
      message: "LoginId and password are required." 
    });
  }

  try {
    const result = await loginService(loginId, pwd);

    if (result.status) {
      return res.status(200).json({
        success: true,
        message: result.message,
        user: result.user,
        token: result.token
      });
    } else {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error: any) {
    console.error("Login controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Legacy exports for backward compatibility
export const login = loginController;
export const signup = signupController;
