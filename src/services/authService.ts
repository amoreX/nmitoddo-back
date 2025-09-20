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

// Legacy functions for backward compatibility (if needed)
export const loginUser = loginService;
export const signupUser = signupService;
