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
  loginId: string,
  email: string,
  password: string,
  fullName?: string, // optional
): Promise<{ status: boolean; message: string; user?: any }> => {
  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return { status: false, message: "Email already registered" };
    }

    const existingLoginId = await prisma.user.findUnique({
      where: { loginId },
    });
    if (existingLoginId) {
      return {
        status: false,
        message: "Login ID already taken, choose a different one",
      };
    }

    // Hash the password
    // const saltRounds = 10;
    // const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        loginId,
        email,
        passwordHash: password,
        fullName: fullName || "",
        role: "admin", // default role
      },
    });

    return { status: true, message: "Signup successful", user: newUser };
  } catch (err) {
    console.error("Signup error:", err);
    return { status: false, message: "An error occurred during signup" };
  }
};
