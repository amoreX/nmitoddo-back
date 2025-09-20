import { Request, Response } from 'express';
import manufacturingOrderService from '../services/manufacturingOrderService';

export const createManufacturingOrder = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    const mo = await manufacturingOrderService.createManufacturingOrder(
      userId
    );

    res.status(201).json({ success: true, data: mo });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};