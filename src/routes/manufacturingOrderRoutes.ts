import { Router } from "express";
import { createManufacturingOrder } from "../controllers/manufacturingOrderController";

const manufacturingOrderRoutes = Router();

// Create a new Manufacturing Order
manufacturingOrderRoutes.post("/new", createManufacturingOrder);

export default manufacturingOrderRoutes;
