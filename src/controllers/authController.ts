import { Request, Response } from "express";
import { loginUser, signupUser } from "../services/authService";

export const login = async (req: Request, res: Response) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res
      .status(400)
      .json({ message: "Login Id and password are required." });
  }

  try {
    const result = await loginUser(loginId, password);

    if (result.status) {
      return res.status(200).json({ message: result.message });
    } else {
      return res.status(401).json({ message: result.message });
    }
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const success = await signupUser(email, password);

    if (success) {
      return res.status(201).json({ message: "Signup successful." });
    } else {
      return res
        .status(409)
        .json({ message: "User already exists or signup failed." });
    }
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};
