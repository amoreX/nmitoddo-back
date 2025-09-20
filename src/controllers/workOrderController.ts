import { Request, Response } from "express";
import { createWorkOrderService } from "../services/workOrderService";
export const createWorkOrder = async (req: Request, res: Response) => {
  try {
    const { userId, moId, operation, durationMins, comments } = req.body;

    const wo = await createWorkOrderService(moId, operation, durationMins, comments);

    res.status(201).json({ success: true, data: wo });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
