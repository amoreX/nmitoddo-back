import { Request, Response } from "express";
import {
  createManufacturingOrderService,
  saveDraftManufacturingOrderService,
} from "../services/manufactureService";
export const createManufacturingOrder = async (req: Request, res: Response) => {
  try {
    const { userId, productId, quantity, scheduleStartDate, deadline } = req.body;
    
    // Use userId from body, or fallback to authenticated user ID, or default to 10
    const createdById = userId || req.userId || 10;

    const mo = await createManufacturingOrderService(
      createdById,
      productId,
      quantity,
      scheduleStartDate,
      deadline
    );

    res.status(201).json({ success: true, data: mo });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const draftManufacturingOrder = async (req: Request, res: Response) => {
  try {
    // Destructure all fields sent from frontend
    const {
      id,
      userId, // Creator of the MO
      productId,
      quantity,
      scheduleStartDate,
      deadline,
      assignedToId,
      components, // Array of { componentId, quantity }
      workOrders, // Array of { operation, assignedToId, workCenterId }
      status, // Optional, default to draft
    } = req.body;

    // Construct payload for service
    const moData = {
      id: id,
      createdById: userId,
      productId,
      quantity,
      scheduleStartDate,
      deadline,
      assignedToId,
      components,
      workOrders,
      status: status || "draft",
    };

    // Call service to save the MO draft
    const mo = await saveDraftManufacturingOrderService(moData);

    res.status(201).json({ success: true, data: mo });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
