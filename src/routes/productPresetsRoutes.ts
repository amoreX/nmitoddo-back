import { Router } from "express";
import {
  createProductPreset,
  getAllProductPresets,
  getProductPresetById,
  updateProductPreset,
  deleteProductPreset,
} from "../controllers/productPresetsController";

const productPresetsRoutes = Router();

// Create a new product preset
productPresetsRoutes.post("/new", createProductPreset);

// Get all product presets
productPresetsRoutes.get("/", getAllProductPresets);

// Get a specific product preset by ID
productPresetsRoutes.get("/:id", getProductPresetById);

// Update a product preset
productPresetsRoutes.put("/:id", updateProductPreset);

// Delete a product preset
productPresetsRoutes.delete("/:id", deleteProductPreset);

export default productPresetsRoutes;