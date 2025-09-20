import { Request, Response } from "express";
import { createWorkOrderService } from "../services/workOrderService";
export const createWorkOrder = async (req: Request, res: Response) => {
  try {
    const {moId, operation, durationMins, comments, workCenterId} = req.body;

    const wo = await createWorkOrderService({moId, operation, durationMins, comments,workCenterId});

    res.status(201).json({ success: true, data: wo });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
