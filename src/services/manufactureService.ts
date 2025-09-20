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

export const saveDraftManufacturingOrderService = async (
  moData: MODraftInput,
) => {
  // Create the manufacturing order
  const mo = await prisma.manufacturingOrder.upsert({
    where: {
      id: moData.id,
    },
    update: {
      id: moData.id,
      createdById: moData.createdById,
      productId: moData.productId,
      quantity: moData.quantity,
      scheduleStartDate: moData.scheduleStartDate,
      deadline: moData.deadline,
      assignedToId: moData.assignedToId,
      status: "draft",
      product: moData.productId
        ? {
            connect: { id: moData.productId },
          }
        : undefined,
    },
    create: {
      id: moData.id,
      createdById: moData.createdById,
      productId: moData.productId,
      quantity: moData.quantity,
      scheduleStartDate: moData.scheduleStartDate,
      deadline: moData.deadline,
      assignedToId: moData.assignedToId,
      status: "draft",
      product: moData.productId
        ? {
            connect: { id: moData.productId },
          }
        : undefined,
    },
  });

  // Save BOM components if provided
  if (moData.components && moData.productId) {
    for (const comp of moData.components) {
      await prisma.billOfMaterial.create({
        data: {
          productId: moData.productId,
          componentId: comp.componentId,
          quantity: comp.quantity,
        },
      });
    }
  }

  return mo;
};

interface ComponentInput {
  componentId: number;
  quantity: number;
}

interface WorkOrderInput {
  operation: string;
  status: "draft" | "to_do" | "started" | "paused" | "completed";
  comments?: string;
  workCenterId?: number;
  assignedToId?: number;
  startedAt?: Date;
  completedAt?: Date;
}

interface MODraftInput {
  id: number;
  createdById: number;
  productId?: number;
  quantity: number;
  scheduleStartDate?: Date;
  deadline?: Date;
  assignedToId?: number;
  components?: ComponentInput[];
  workOrders?: WorkOrderInput[];
  status: string;
}
