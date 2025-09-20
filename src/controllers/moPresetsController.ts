import { Request, Response } from "express";
import {
  getAllMOPresetsService,
  getMOPresetByIdService,
  createMOPresetService,
  updateMOPresetService,
  deleteMOPresetService,
} from "../services/moPresetsService";
import prisma from "../prisma";

export const getAllMOPresets = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Authentication required",
      });
    }

    // Get user role from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "User not found",
      });
    }

    const result = await getAllMOPresetsService(user.role);
    
    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in getAllMOPresets:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getMOPresetById = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const { id } = req.params;

    if (!userRole) {
      return res.status(401).json({
        status: false,
        message: "Authentication required",
      });
    }

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: false,
        message: "Valid MO preset ID is required",
      });
    }

    const result = await getMOPresetByIdService(Number(id), userRole);
    
    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error: any) {
    console.error("Error in getMOPresetById:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const createMOPreset = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;
    const { name, description, quantity, productId } = req.body;

    if (!userRole || !userId) {
      return res.status(401).json({
        status: false,
        message: "Authentication required",
      });
    }

    if (!name || !quantity || !productId) {
      return res.status(400).json({
        status: false,
        message: "Name, quantity, and productId are required",
      });
    }

    if (typeof quantity !== "number" || quantity <= 0) {
      return res.status(400).json({
        status: false,
        message: "Quantity must be a positive number",
      });
    }

    if (typeof productId !== "number" || productId <= 0) {
      return res.status(400).json({
        status: false,
        message: "Valid productId is required",
      });
    }

    const result = await createMOPresetService(
      { name, description, quantity, productId },
      userId,
      userRole
    );
    
    if (result.status) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in createMOPreset:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateMOPreset = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const { id } = req.params;
    const { name, description, quantity, productId } = req.body;

    if (!userRole) {
      return res.status(401).json({
        status: false,
        message: "Authentication required",
      });
    }

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: false,
        message: "Valid MO preset ID is required",
      });
    }

    // Validate quantity if provided
    if (quantity !== undefined && (typeof quantity !== "number" || quantity <= 0)) {
      return res.status(400).json({
        status: false,
        message: "Quantity must be a positive number",
      });
    }

    // Validate productId if provided
    if (productId !== undefined && (typeof productId !== "number" || productId <= 0)) {
      return res.status(400).json({
        status: false,
        message: "Valid productId is required",
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (productId !== undefined) updateData.productId = productId;

    const result = await updateMOPresetService(Number(id), updateData, userRole);
    
    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in updateMOPreset:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteMOPreset = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const { id } = req.params;

    if (!userRole) {
      return res.status(401).json({
        status: false,
        message: "Authentication required",
      });
    }

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: false,
        message: "Valid MO preset ID is required",
      });
    }

    const result = await deleteMOPresetService(Number(id), userRole);
    
    if (result.status) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Error in deleteMOPreset:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};