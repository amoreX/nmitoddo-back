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

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
    }

    const workCenter = await createWorkCenterService({
      name,
      location,
      capacityPerHour,
      costPerHour,
      createdById: userId,
    });

    res.status(201).json({ success: true, data: workCenter });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};