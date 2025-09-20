import { Request, Response } from "express";
import { signupService, loginService, testSessionCreation, updateUserService, loginWithEmailService } from "../services/authService";

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

/**
 * Update User Controller
 * Expected input JSON:
 * {
 *   "name": "New Name",      // optional
 *   "email": "new@email.com" // optional
 * }
 * Requires authentication (user ID from JWT)
 */
export const updateUserController = async (req: Request, res: Response) => {
  const { name, email } = req.body;
  
  // Get user ID from JWT token (set by auth middleware)
  const userId = req.userId;
  
  // Validate that user ID is present (compulsory for update)
  if (!userId) {
    return res.status(401).json({ 
      success: false,
      message: "Authentication required - User ID not found in token" 
    });
  }

  // Validate that user ID is a valid number
  if (typeof userId !== 'number' || userId <= 0) {
    return res.status(401).json({ 
      success: false,
      message: "Invalid user ID in authentication token" 
    });
  }

  // Validate that at least one field is provided
  if (!name && !email) {
    return res.status(400).json({ 
      success: false,
      message: "At least one field (name or email) must be provided" 
    });
  }

  // Validate email format if provided
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid email format" 
    });
  }

  try {
    const result = await updateUserService(userId, { name, email });

    if (result.status) {
      return res.status(200).json({
        success: true,
        message: result.message,
        user: result.user
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error: any) {
    console.error("Update user controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Login with Email Controller
 * Expected input JSON:
 * {
 *   "email": "alice@example.com",
 *   "pwd": "alice"
 * }
 */
export const loginWithEmailController = async (req: Request, res: Response) => {
  const { email, pwd } = req.body;

  // Validate required fields
  if (!email || !pwd) {
    return res.status(400).json({ 
      success: false,
      message: "Email and password are required." 
    });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid email format." 
    });
  }

  try {
    const result = await loginWithEmailService(email, pwd);

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
    console.error("Login with email controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Test Session Creation Controller - for debugging
 */
export const testSessionController = async (req: Request, res: Response) => {
  try {
    await testSessionCreation();
    res.status(200).json({ 
      success: true,
      message: "Session test completed - check console logs" 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: "Session test failed: " + error.message 
    });
  }
};

/**
 * Helper function to validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Legacy exports for backward compatibility
export const login = loginController;
export const signup = signupController;
