import { Router } from "express";
import {
  recordStockMovement,
  getProductStock,
  getAllProductStocks,
  updateProductStock,
  deleteProductStock,
  getProductLedger,
  getProductLedgerByProductId,
  verifyProductStock,
} from "../controllers/stockController";
import { authMiddleware } from "../middleware/authMiddleware";

const stockRoutes = Router();

// All stock routes require authentication
stockRoutes.use(authMiddleware);

/**
 * Stock Movement Routes
 */

// POST /api/stock/movement - Record a stock movement (in/out)
// Body: { productId: number, movementType: "in"|"out", quantity: number, referenceType?: string, referenceId?: number }
// Requires: admin or manager role
stockRoutes.post("/movement", recordStockMovement);

/**
 * Product Ledger Routes (must come before /:productId routes)
 */

// GET /api/stock/ledger - Get product ledger with optional filters
// Query params: productId?, movementType?, referenceType?, limit?
// Public to authenticated users
stockRoutes.get("/ledger", getProductLedger);

/**
 * Product Stock Routes
 */

// GET /api/stock - Get all product stocks
// Public to authenticated users
stockRoutes.get("/", getAllProductStocks);

// GET /api/stock/:productId - Get current stock for specific product
// Public to authenticated users
stockRoutes.get("/:productId", getProductStock);

// PUT /api/stock/:productId - Update product stock quantity
// Body: { quantity: number, reason?: string }
// Requires: admin or manager role
stockRoutes.put("/:productId", updateProductStock);

// DELETE /api/stock/:productId - Delete product stock record
// Requires: admin or manager role
stockRoutes.delete("/:productId", deleteProductStock);

// GET /api/stock/:productId/ledger - Get ledger entries for specific product
// Query params: movementType?, referenceType?, limit?
// Public to authenticated users
stockRoutes.get("/:productId/ledger", getProductLedgerByProductId);

/**
 * Stock Verification Routes
 */

// GET /api/stock/:productId/verify - Verify stock consistency
// Compares ProductStock with calculated quantity from ProductLedger
// Public to authenticated users
stockRoutes.get("/:productId/verify", verifyProductStock);

export default stockRoutes;