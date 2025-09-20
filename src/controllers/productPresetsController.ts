import { Request, Response } from "express";
import {
  createProductPresetService,
  getAllProductPresetsService,
  getProductPresetByIdService,
  updateProductPresetService,
  deleteProductPresetService,
} from "../services/productPresetsService";

export const createProductPreset = async (req: Request, res: Response) => {
  try {
    const { name, description, unit, userId } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const productPreset = await createProductPresetService({
      name,
      description,
      unit,
      createdById: userId,
    });

    res.status(201).json({ success: true, data: productPreset });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllProductPresets = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const productPresets = await getAllProductPresetsService(Number(userId));

    res.status(200).json({ success: true, data: productPresets });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getProductPresetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const productPreset = await getProductPresetByIdService(
      Number(id),
      Number(userId)
    );

    res.status(200).json({ success: true, data: productPreset });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProductPreset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, unit, userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const updatedPreset = await updateProductPresetService({
      id: Number(id),
      name,
      description,
      unit,
      userId: Number(userId),
    });

    res.status(200).json({ success: true, data: updatedPreset });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteProductPreset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await deleteProductPresetService(Number(id), Number(userId));

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};