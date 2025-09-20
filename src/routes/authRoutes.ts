import { Router } from "express";
import { loginController, signupController, testSessionController } from "../controllers/authController";

const authRoutes = Router();

// POST /auth/signup - User registration
// Expected input: { email: string, password: string, name?: string }
authRoutes.post("/signup", signupController);

// POST /auth/login - User authentication
// Expected input: { email: string, password: string }
authRoutes.post("/login", loginController);

// GET /auth/test-session - Test session creation (debugging)
authRoutes.get("/test-session", testSessionController);

export default authRoutes;
