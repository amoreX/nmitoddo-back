import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createBOM,
  getAllBOMs,
  getBOMByProductId,
  updateBOM,
  deleteBOM,
  checkBOMUsage,
} from "../controllers/bomController";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create new BOM
router.post("/", createBOM);

// Get all BOMs with filtering
router.get("/", getAllBOMs);

// Get BOM by product ID
router.get("/:productId", getBOMByProductId);

// Update BOM by product ID
router.put("/:productId", updateBOM);

// Delete BOM by product ID
router.delete("/:productId", deleteBOM);

// Check BOM usage in active Manufacturing Orders
router.get("/:productId/usage", checkBOMUsage);

export default router;