import prisma from "../prisma";
import { OrderStatus } from "@prisma/client";

export const createManufacturingOrderService = async (
  createdById: number,
): Promise<{ id: number; status: OrderStatus; createdById: number }> => {
  const mo = await (prisma.manufacturingOrder as any).create({
    data: { status: OrderStatus.draft, createdById },
  });
  return mo;
};
