import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";
const JWT_EXPIRES_IN = "7d";

interface AuthResponse {
  status: boolean;
  message: string;
  user?: any;
  token?: string;
}

/**
 * Signup Service
 * Input JSON example:
 * {
 *   "loginId": "alice@example.com",
 *   "pwd": "alice",
 *   "name": "Alice Admin"
 * }
 */
export const signupService = async (
  loginId: string,
  pwd: string,
  name?: string
): Promise<AuthResponse> => {
  try {
    // Check if user already exists by loginId
    const existingUser = await prisma.user.findUnique({
      where: { loginId }
    });

    if (existingUser) {
      return {
        status: false,
        message: "User with this loginId already exists"
      };
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(pwd, saltRounds);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: loginId, // Use loginId as email for backward compatibility
        password: hashedPassword,
        name: name || null,
        loginId: loginId,
        role: "user" // default role
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, loginId: newUser.loginId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    console.log("Creating session for new user:", newUser.id, "token length:", token.length);
    
    try {
      const session = await prisma.session.create({
        data: {
          token,
          userId: newUser.id,
          expiresAt
        }
      });
    } catch (sessionError) {
      console.error("Failed to create session for new user:", sessionError);
      // Continue with signup even if session creation fails
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      status: true,
      message: "User created successfully",
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      status: false,
      message: "An error occurred during signup"
    };
  }
};

/**
 * Login Service
 * Input JSON example:
 * {
 *   "loginId": "alice@example.com",
 *   "pwd": "alice"
 * }
 */
export const loginService = async (
  loginId: string,
  pwd: string
): Promise<AuthResponse> => {
  try {
    // Find user by loginId
    const user = await prisma.user.findUnique({
      where: { loginId }
    });

    if (!user) {
      return {
        status: false,
        message: "Invalid loginId or password"
      };
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(pwd, user.password);

    if (!isPasswordValid) {
      return {
        status: false,
        message: "Invalid loginId or password"
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, loginId: user.loginId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    try {
      const session = await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt
        }
      });
    } catch (sessionError) {
      console.error("Failed to create session:", sessionError);
      // Continue with login even if session creation fails
      // This ensures the user can still log in
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      status: true,
      message: "Login successful",
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      status: false,
      message: "An error occurred during login"
    };
  }
};

/**
 * Logout Service - Clean up session from database
 */
export const logoutService = async (token: string): Promise<AuthResponse> => {
  try {
    // Delete the session from database
    await prisma.session.deleteMany({
      where: { token }
    });

    return {
      status: true,
      message: "Logged out successfully"
    };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      status: false,
      message: "An error occurred during logout"
    };
  }
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    console.log("Cleaned up", result.count, "expired sessions");
  } catch (error) {
    console.error("Cleanup expired sessions error:", error);
  }
};

/**
 * Test session creation - for debugging
 */
export const testSessionCreation = async (): Promise<void> => {
  try {
    console.log("Testing session creation...");
    
    // Test creating a simple session
    const testSession = await prisma.session.create({
      data: {
        token: "test-token-" + Date.now(),
        userId: 1, // Assuming user ID 1 exists
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }
    });
    
    // Clean it up
    await prisma.session.delete({
      where: { id: testSession.id }
    });
    
    console.log("Test session cleaned up");
  } catch (error) {
    console.error("Test session creation failed:", error);
  }
};

// Legacy functions for backward compatibility (if needed)
export const loginUser = loginService;
export const signupUser = signupService;
