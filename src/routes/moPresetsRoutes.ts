import { Router } from "express";
import {
  getAllMOPresets,
  getMOPresetById,
  createMOPreset,
  updateMOPreset,
  deleteMOPreset,
} from "../controllers/moPresetsController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// GET /api/moPresets - Get all MO presets
router.get("/", getAllMOPresets);

// GET /api/moPresets/:id - Get MO preset by ID
router.get("/:id", getMOPresetById);

// POST /api/moPresets - Create new MO preset (admin only)
router.post("/", createMOPreset);

// PUT /api/moPresets/:id - Update MO preset (admin only)
router.put("/:id", updateMOPreset);

// DELETE /api/moPresets/:id - Delete MO preset (admin only)
router.delete("/:id", deleteMOPreset);

export default router;