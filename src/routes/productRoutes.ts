import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsWithLowStock,
} from "../controllers/productController";
import { getBOMPopulation } from "../controllers/manufacturingOrderController";
import { authMiddleware } from "../middleware/authMiddleware";

const productRoutes = Router();

// All product routes require authentication
productRoutes.use(authMiddleware);

/**
 * Special Routes (must come before /:id routes to avoid conflicts)
 */

// GET /api/products/search - Search products by name or description
// Query params: q (required), limit (optional, default: 50)
// Public to authenticated users
productRoutes.get("/search", searchProducts);

// GET /api/products/low-stock - Get products with low stock
// Query params: threshold (optional, default: 10)
// Public to authenticated users
productRoutes.get("/low-stock", getProductsWithLowStock);

// GET /api/products/:id/bom - Get BOM population data for product
// Returns components, operations, and cost estimates for MO creation
productRoutes.get("/:id/bom", getBOMPopulation);

/**
 * Main CRUD Routes
 */

// GET /api/products - Get all products with BOM, stock, and usage info
// Public to authenticated users
productRoutes.get("/", getAllProducts);

// POST /api/products - Create new product
// Body: { name: string, description?: string, unit?: string }
// Requires: admin or manager role
productRoutes.post("/", createProduct);

// GET /api/products/:id - Get specific product with detailed information
// Public to authenticated users
productRoutes.get("/:id", getProductById);

// PUT /api/products/:id - Update product
// Body: { name?: string, description?: string, unit?: string }
// Requires: admin or manager role
productRoutes.put("/:id", updateProduct);

// DELETE /api/products/:id - Delete product (only if no dependencies)
// Requires: admin or manager role
productRoutes.delete("/:id", deleteProduct);

export default productRoutes;