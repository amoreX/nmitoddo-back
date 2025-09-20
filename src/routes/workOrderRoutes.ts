import { Router } from "express";
import { createWorkOrder } from "../controllers/workOrderController";

const workOrderRoutes = Router();

workOrderRoutes.post("/addWO", createWorkOrder);

export default workOrderRoutes;