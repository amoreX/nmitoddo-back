import { Request, Response } from "express";
import {
  getAllProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
  searchProductsService,
  getProductsWithLowStockService,
} from "../services/productService";
import { Role } from "@prisma/client";
import prisma from "../prisma";

/**
 * GET /api/products
 * Get all products with BOM, stock, and usage information
 */
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const result = await getAllProductsService();

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in getAllProducts:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/products/:id
 * Get specific product with detailed information
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: false,
        message: "Valid product ID is required",
      });
    }

    const result = await getProductByIdService(Number(id));

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error: any) {
    console.error("Error in getProductById:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * POST /api/products
 * Create new product (Admin/Manager only)
 */
export const createProduct = async (req: Request, res: Response) => {
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

    const { name, description, unit } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        status: false,
        message: "Product name is required and must be a non-empty string",
      });
    }

    if (name.trim().length > 255) {
      return res.status(400).json({
        status: false,
        message: "Product name must be less than 255 characters",
      });
    }

    if (description && typeof description !== "string") {
      return res.status(400).json({
        status: false,
        message: "Description must be a string",
      });
    }

    if (unit && typeof unit !== "string") {
      return res.status(400).json({
        status: false,
        message: "Unit must be a string",
      });
    }

    const result = await createProductService(
      {
        name: name.trim(),
        description: description?.trim(),
        unit: unit?.trim(),
      },
      user.role as Role
    );

    if (result.status) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in createProduct:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * PUT /api/products/:id
 * Update product (Admin/Manager only)
 */
export const updateProduct = async (req: Request, res: Response) => {
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

    const { id } = req.params;
    const { name, description, unit } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: false,
        message: "Valid product ID is required",
      });
    }

    // Validate fields if provided
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          status: false,
          message: "Product name must be a non-empty string",
        });
      }
      if (name.trim().length > 255) {
        return res.status(400).json({
          status: false,
          message: "Product name must be less than 255 characters",
        });
      }
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({
        status: false,
        message: "Description must be a string",
      });
    }

    if (unit !== undefined && typeof unit !== "string") {
      return res.status(400).json({
        status: false,
        message: "Unit must be a string",
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (unit !== undefined) updateData.unit = unit?.trim();

    const result = await updateProductService(
      Number(id),
      updateData,
      user.role as Role
    );

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in updateProduct:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/products/:id
 * Delete product (Admin/Manager only)
 */
export const deleteProduct = async (req: Request, res: Response) => {
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

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: false,
        message: "Valid product ID is required",
      });
    }

    const result = await deleteProductService(Number(id), user.role as Role);

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in deleteProduct:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/products/search
 * Search products by name or description
 */
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query;

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return res.status(400).json({
        status: false,
        message: "Search query 'q' is required",
      });
    }

    let parsedLimit = 50;
    if (limit) {
      if (isNaN(Number(limit)) || Number(limit) <= 0 || Number(limit) > 1000) {
        return res.status(400).json({
          status: false,
          message: "Limit must be a number between 1 and 1000",
        });
      }
      parsedLimit = Number(limit);
    }

    const result = await searchProductsService(q.trim(), parsedLimit);

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in searchProducts:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET /api/products/low-stock
 * Get products with low stock levels
 */
export const getProductsWithLowStock = async (req: Request, res: Response) => {
  try {
    const { threshold } = req.query;

    let parsedThreshold = 10; // Default threshold
    if (threshold) {
      if (isNaN(Number(threshold)) || Number(threshold) < 0) {
        return res.status(400).json({
          status: false,
          message: "Threshold must be a non-negative number",
        });
      }
      parsedThreshold = Number(threshold);
    }

    const result = await getProductsWithLowStockService(parsedThreshold);

    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in getProductsWithLowStock:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};