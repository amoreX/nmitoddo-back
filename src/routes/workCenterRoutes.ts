import { Router } from "express";
import { createWorkCenter } from "../controllers/workCenterController";

const workCenterRoutes = Router();

workCenterRoutes.post("/new", createWorkCenter);

export default workCenterRoutes;