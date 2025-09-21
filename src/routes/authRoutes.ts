import { Router } from "express";
import { loginController, signupController, testSessionController, updateUserController, loginWithEmailController, updateRoleController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const authRoutes = Router();

// POST /auth/signup - User registration
// Expected input: { loginId: string, pwd: string, name?: string }
authRoutes.post("/signup", signupController);

// POST /auth/login - User authentication
// Expected input: { loginId: string, pwd: string }
authRoutes.post("/login", loginController);

// POST /auth/loginWithEmail - User authentication with email
// Expected input: { email: string, pwd: string }
authRoutes.post("/loginWithEmail", loginWithEmailController);

// PUT /auth/user - Update user information (protected route)
// Expected input: { name?: string, email?: string }
authRoutes.put("/user", authMiddleware, updateUserController);

// PUT /auth/updateRole - Update user role (admin only)
// Expected input: { updateUserId: number, newRole: string }
authRoutes.put("/updateRole", updateRoleController);

// GET /auth/test-session - Test session creation (debugging)
authRoutes.get("/test-session", testSessionController);

export default authRoutes;
