import { Router } from "express";
import { createWorkOrder } from "../controllers/workOrderController";

const workOrderRoutes = Router();

workOrderRoutes.post("/new", createWorkOrder);

export default workOrderRoutes;