import prisma from '../prisma';
import { OrderStatus } from '@prisma/client';

class ManufacturingOrderService {
  async createManufacturingOrder(
    createdById: number
  ): Promise<{ id: number; status: OrderStatus; createdById: number }> {
    const mo = await (prisma.manufacturingOrder as any).create({
      data: { status: OrderStatus.draft, createdById },
    });
    return { id: mo.id, status: mo.status, createdById: mo.createdById };
  }
}

export default new ManufacturingOrderService();