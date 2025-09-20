import prisma from "../prisma";
import { Role, MovementType } from "@prisma/client";

// Helper function to validate user role
const validateManagerOrAdminRole = (userRole: Role) => {
  if (userRole !== Role.admin && userRole !== Role.manager) {
    throw new Error("Access denied: Only admin and manager roles can manage stock");
  }
};

interface StockMovementInput {
  productId: number;
  movementType: MovementType;
  quantity: number;
  referenceType?: string; // e.g., "purchase", "sales", "MO", "WO", "adjustment"
  referenceId?: number;
  reason?: string;
}

export const recordStockMovementService = async (
  movementData: StockMovementInput,
  userRole: Role
) => {
  try {
    validateManagerOrAdminRole(userRole);

    if (movementData.quantity <= 0) {
      return {
        status: false,
        message: "Quantity must be greater than 0",
      };
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: movementData.productId },
      include: { stock: true },
    });

    if (!product) {
      return {
        status: false,
        message: "Product not found",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record the movement in ProductLedger
      const ledgerEntry = await tx.productLedger.create({
        data: {
          productId: movementData.productId,
          movementType: movementData.movementType,
          quantity: movementData.quantity,
          referenceType: movementData.referenceType || "manual",
          referenceId: movementData.referenceId || null,
        },
      });

      // 2. Calculate new stock quantity
      const currentQuantity = product.stock?.quantity || 0;
      const newQuantity = movementData.movementType === MovementType.in
        ? currentQuantity + movementData.quantity
        : currentQuantity - movementData.quantity;

      // 3. Validate stock won't go negative
      if (newQuantity < 0) {
        throw new Error(`Insufficient stock. Current: ${currentQuantity}, Required: ${movementData.quantity}`);
      }

      // 4. Update or create ProductStock
      const updatedStock = await tx.productStock.upsert({
        where: { productId: movementData.productId },
        update: { quantity: newQuantity },
        create: { 
          productId: movementData.productId, 
          quantity: newQuantity 
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      });

      return {
        ledgerEntry,
        updatedStock,
        previousQuantity: currentQuantity,
        newQuantity,
      };
    });

    return {
      status: true,
      message: "Stock movement recorded successfully",
      data: result,
    };
  } catch (error: any) {
    console.error("Error recording stock movement:", error);
    return {
      status: false,
      message: error.message || "Failed to record stock movement",
    };
  }
};

export const getProductStockService = async (productId: number) => {
  try {
    const productStock = await prisma.productStock.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            unit: true,
          },
        },
      },
    });

    if (!productStock) {
      // If no stock record exists, check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          description: true,
          unit: true,
        },
      });

      if (!product) {
        return {
          status: false,
          message: "Product not found",
        };
      }

      return {
        status: true,
        message: "Product stock retrieved (no stock record exists)",
        data: {
          id: null,
          productId: product.id,
          quantity: 0,
          updatedAt: null,
          product,
        },
      };
    }

    return {
      status: true,
      message: "Product stock retrieved successfully",
      data: productStock,
    };
  } catch (error: any) {
    console.error("Error getting product stock:", error);
    return {
      status: false,
      message: "Failed to get product stock",
    };
  }
};

export const getAllProductStocksService = async () => {
  try {
    const stocks = await prisma.productStock.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            unit: true,
          },
        },
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    });

    return {
      status: true,
      message: "All product stocks retrieved successfully",
      data: stocks,
    };
  } catch (error: any) {
    console.error("Error getting all product stocks:", error);
    return {
      status: false,
      message: "Failed to get product stocks",
    };
  }
};

export const getProductLedgerService = async (
  productId?: number,
  movementType?: MovementType,
  referenceType?: string,
  limit = 50
) => {
  try {
    const whereClause: any = {};
    
    if (productId) whereClause.productId = productId;
    if (movementType) whereClause.movementType = movementType;
    if (referenceType) whereClause.referenceType = referenceType;

    const ledgerEntries = await prisma.productLedger.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return {
      status: true,
      message: "Product ledger retrieved successfully",
      data: ledgerEntries,
    };
  } catch (error: any) {
    console.error("Error getting product ledger:", error);
    return {
      status: false,
      message: "Failed to get product ledger",
    };
  }
};

export const updateProductStockService = async (
  productId: number,
  newQuantity: number,
  userRole: Role,
  reason = "Manual adjustment"
) => {
  try {
    validateManagerOrAdminRole(userRole);

    if (newQuantity < 0) {
      return {
        status: false,
        message: "Stock quantity cannot be negative",
      };
    }

    // Get current stock
    const currentStock = await prisma.productStock.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
    });

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return {
        status: false,
        message: "Product not found",
      };
    }

    const currentQuantity = currentStock?.quantity || 0;
    const difference = newQuantity - currentQuantity;

    if (difference === 0) {
      return {
        status: true,
        message: "No change in stock quantity",
        data: currentStock,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Record the adjustment in ledger
      await tx.productLedger.create({
        data: {
          productId,
          movementType: difference > 0 ? MovementType.in : MovementType.out,
          quantity: Math.abs(difference),
          referenceType: "adjustment",
          referenceId: null,
        },
      });

      // Update stock
      const updatedStock = await tx.productStock.upsert({
        where: { productId },
        update: { quantity: newQuantity },
        create: { productId, quantity: newQuantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              unit: true,
            },
          },
        },
      });

      return updatedStock;
    });

    return {
      status: true,
      message: "Product stock updated successfully",
      data: result,
      adjustment: {
        previousQuantity: currentQuantity,
        newQuantity,
        difference,
      },
    };
  } catch (error: any) {
    console.error("Error updating product stock:", error);
    return {
      status: false,
      message: error.message || "Failed to update product stock",
    };
  }
};

export const deleteProductStockService = async (
  productId: number,
  userRole: Role
) => {
  try {
    validateManagerOrAdminRole(userRole);

    const productStock = await prisma.productStock.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!productStock) {
      return {
        status: false,
        message: "Product stock not found",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Record the removal in ledger if there was stock
      if (productStock.quantity > 0) {
        await tx.productLedger.create({
          data: {
            productId,
            movementType: MovementType.out,
            quantity: productStock.quantity,
            referenceType: "stock_removal",
            referenceId: null,
          },
        });
      }

      // Delete the stock record
      await tx.productStock.delete({
        where: { productId },
      });

      return productStock;
    });

    return {
      status: true,
      message: "Product stock deleted successfully",
      data: result,
    };
  } catch (error: any) {
    console.error("Error deleting product stock:", error);
    return {
      status: false,
      message: "Failed to delete product stock",
    };
  }
};

// Utility function to calculate current stock from ledger (for verification)
export const calculateStockFromLedgerService = async (productId: number) => {
  try {
    const movements = await prisma.productLedger.findMany({
      where: { productId },
      select: {
        movementType: true,
        quantity: true,
      },
    });

    const totalIn = movements
      .filter(m => m.movementType === MovementType.in)
      .reduce((sum, m) => sum + m.quantity, 0);

    const totalOut = movements
      .filter(m => m.movementType === MovementType.out)
      .reduce((sum, m) => sum + m.quantity, 0);

    const calculatedQuantity = totalIn - totalOut;

    // Get actual stock from ProductStock table
    const actualStock = await prisma.productStock.findUnique({
      where: { productId },
    });

    return {
      status: true,
      message: "Stock calculation completed",
      data: {
        calculatedQuantity,
        actualQuantity: actualStock?.quantity || 0,
        isConsistent: calculatedQuantity === (actualStock?.quantity || 0),
        totalMovementsIn: totalIn,
        totalMovementsOut: totalOut,
      },
    };
  } catch (error: any) {
    console.error("Error calculating stock from ledger:", error);
    return {
      status: false,
      message: "Failed to calculate stock from ledger",
    };
  }
};