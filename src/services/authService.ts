import bcrypt from "bcrypt";
import prisma from "../prisma";
import { login } from "../controllers/authController";

export const loginUser = async (
  loginId: string,
  password: string,
): Promise<{ status: boolean; message: string; user?: any }> => {
  try {
    // Find user by loginId
    const user = await prisma.user.findUnique({
      where: {
        loginId: loginId,
      },
    });

    // User not found
    if (!user) {
      return { status: false, message: "User not found" };
    }

    // Compare password
    // const isMatch = await bcrypt.compare(password, user.passwordHash);
    const isMatch = password == user.passwordHash;
    if (!isMatch) {
      return { status: false, message: "Incorrect password" };
    }

    // Password matches, return user details
    return { status: true, message: "Login successful", user };
  } catch (err) {
    console.error("Login error:", err);
    return { status: false, message: "An error occurred during login" };
  }
};

export const signupUser = async (
  email: string,
  password: string,
): Promise<boolean> => {
  // fetch user if exists or not

  // If user exists, throw error
  // if (existingUser) {
  //   throw new Error("User with this email already exists");
  // }

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user

  return true;
};
