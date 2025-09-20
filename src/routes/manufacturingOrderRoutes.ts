import { Router } from "express";
import {
  createManufacturingOrder,
  draftManufacturingOrder,
  getDashboardMOs,
  getMOWithDetails,
  updateMOStatus,
  deleteMO,
  getComponentAvailability,
  validateMO,
  getBOMPopulation,
  createManufacturingOrderWithBOM,
} from "../controllers/manufacturingOrderController";
import { authMiddleware } from "../middleware/authMiddleware";


const manufacturingOrderRoutes = Router();

// Dashboard endpoint - must come before /:id routes
manufacturingOrderRoutes.get("/dashboard", authMiddleware, getDashboardMOs);

// Create a new Manufacturing Order (basic)
manufacturingOrderRoutes.post("/new", authMiddleware, createManufacturingOrder);

// Create a new Manufacturing Order with automatic BOM population
manufacturingOrderRoutes.post("/new-with-bom", authMiddleware, createManufacturingOrderWithBOM);

// Save draft MO
manufacturingOrderRoutes.post("/save-draft", authMiddleware, draftManufacturingOrder);

// Get component availability for MO
manufacturingOrderRoutes.get("/:id/components", authMiddleware, getComponentAvailability);

// Validate MO before confirmation
manufacturingOrderRoutes.post("/:id/validate", authMiddleware, validateMO);

// Get single MO with details
manufacturingOrderRoutes.get("/:id", authMiddleware, getMOWithDetails);

// Update MO status
manufacturingOrderRoutes.put("/:id/status", authMiddleware, updateMOStatus);

// Delete or cancel MO
manufacturingOrderRoutes.delete("/:id", authMiddleware, deleteMO);

export default manufacturingOrderRoutes;
