import { Request, Response } from "express";
import { createWorkCenterService } from "../services/workCenterService";

export const createWorkCenter = async (req: Request, res: Response) => {
  try {
    const { name, location, capacityPerHour, costPerHour, userId } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: "Name is required" 
      });
    }

    // Use userId from body, or fallback to authenticated user ID, or default to 10
    const createdById = userId || req.userId || 10;

    const workCenter = await createWorkCenterService({
      name,
      location,
      capacityPerHour,
      costPerHour,
      createdById,
    });

    res.status(201).json({ success: true, data: workCenter });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};