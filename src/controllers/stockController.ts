import { Request, Response } from "express";
import {
  recordStockMovementService,
  getProductStockService,
  getAllProductStocksService,
  getProductLedgerService,
  updateProductStockService,
  deleteProductStockService,
  calculateStockFromLedgerService,
} from "../services/stockService";
import { MovementType, Role } from "@prisma/client";
import prisma from "../prisma";

/**
 * POST /api/stock/movement
 * Record a stock movement (in/out) with automatic ledger update
 */
export const recordStockMovement = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Authentication required",
      });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const { productId, movementType, quantity, referenceType, referenceId, reason } = req.body;

    // Validate required fields
    if (!productId || !movementType || !quantity) {
      return res.status(400).json({
        status: false,
        message: "productId, movementType, and quantity are required",
      });
    }

    // Validate movementType
    if (!Object.values(MovementType).includes(movementType)) {
      return res.status(400).json({
        status: false,
        message: "movementType must be 'in' or 'out'",
      });
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      return res.status(400).json({
        status: false,
        message: "quantity must be a positive number",
      });
    }

    const movementData: any = {
      productId: Number(productId),
      movementType,
      quantity: Number(quantity),
      referenceType,
      reason,
    };

    if (referenceId) {
      movementData.referenceId = Number(referenceId);
    }

    const result = await recordStockMovementService(
      movementData,
      user.role as Role
    );

    if (result.status) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in recordStockMovement:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/stock/:productId
 * Get current stock for a specific product
 */
export const getProductStock = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!productId || isNaN(Number(productId))) {
      return res.status(400).json({
        status: false,
        message: "Valid productId is required",
      });
    }

    const result = await getProductStockService(Number(productId));

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error: any) {
    console.error("Error in getProductStock:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/stock
 * Get all product stocks
 */
export const getAllProductStocks = async (req: Request, res: Response) => {
  try {
    const result = await getAllProductStocksService();

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in getAllProductStocks:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * PUT /api/stock/:productId
 * Update product stock quantity directly (with ledger entry)
 */
export const updateProductStock = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Authentication required",
      });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const { productId } = req.params;
    const { quantity, reason } = req.body;

    if (!productId || isNaN(Number(productId))) {
      return res.status(400).json({
        status: false,
        message: "Valid productId is required",
      });
    }

    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({
        status: false,
        message: "quantity must be a non-negative number",
      });
    }

    const result = await updateProductStockService(
      Number(productId),
      Number(quantity),
      user.role as Role,
      reason
    );

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in updateProductStock:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/stock/:productId
 * Delete product stock record
 */
export const deleteProductStock = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Authentication required",
      });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const { productId } = req.params;

    if (!productId || isNaN(Number(productId))) {
      return res.status(400).json({
        status: false,
        message: "Valid productId is required",
      });
    }

    const result = await deleteProductStockService(
      Number(productId),
      user.role as Role
    );

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in deleteProductStock:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/stock/ledger
 * Get product ledger entries with optional filters
 */
export const getProductLedger = async (req: Request, res: Response) => {
  try {
    const { productId, movementType, referenceType, limit } = req.query;

    // Validate optional parameters
    let parsedProductId: number | undefined;
    let parsedMovementType: MovementType | undefined;
    let parsedLimit = 50;

    if (productId) {
      if (isNaN(Number(productId))) {
        return res.status(400).json({
          status: false,
          message: "productId must be a valid number",
        });
      }
      parsedProductId = Number(productId);
    }

    if (movementType) {
      if (!Object.values(MovementType).includes(movementType as MovementType)) {
        return res.status(400).json({
          status: false,
          message: "movementType must be 'in' or 'out'",
        });
      }
      parsedMovementType = movementType as MovementType;
    }

    if (limit) {
      if (isNaN(Number(limit)) || Number(limit) <= 0 || Number(limit) > 1000) {
        return res.status(400).json({
          status: false,
          message: "limit must be a number between 1 and 1000",
        });
      }
      parsedLimit = Number(limit);
    }

    const result = await getProductLedgerService(
      parsedProductId,
      parsedMovementType,
      referenceType as string,
      parsedLimit
    );

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in getProductLedger:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/stock/:productId/ledger
 * Get ledger entries for a specific product
 */
export const getProductLedgerByProductId = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { movementType, referenceType, limit } = req.query;

    if (!productId || isNaN(Number(productId))) {
      return res.status(400).json({
        status: false,
        message: "Valid productId is required",
      });
    }

    let parsedMovementType: MovementType | undefined;
    let parsedLimit = 50;

    if (movementType) {
      if (!Object.values(MovementType).includes(movementType as MovementType)) {
        return res.status(400).json({
          status: false,
          message: "movementType must be 'in' or 'out'",
        });
      }
      parsedMovementType = movementType as MovementType;
    }

    if (limit) {
      if (isNaN(Number(limit)) || Number(limit) <= 0 || Number(limit) > 1000) {
        return res.status(400).json({
          status: false,
          message: "limit must be a number between 1 and 1000",
        });
      }
      parsedLimit = Number(limit);
    }

    const result = await getProductLedgerService(
      Number(productId),
      parsedMovementType,
      referenceType as string,
      parsedLimit
    );

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in getProductLedgerByProductId:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/stock/:productId/verify
 * Verify stock consistency between ProductStock and calculated from ProductLedger
 */
export const verifyProductStock = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!productId || isNaN(Number(productId))) {
      return res.status(400).json({
        status: false,
        message: "Valid productId is required",
      });
    }

    const result = await calculateStockFromLedgerService(Number(productId));

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in verifyProductStock:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};