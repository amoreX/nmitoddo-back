import { Router } from "express";
import { login, signup } from "../controllers/authController";

const authRoutes = Router();

authRoutes.post("/login", login);

authRoutes.post("/signup", signup);

export default authRoutes;
