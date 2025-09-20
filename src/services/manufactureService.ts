import prisma from "../prisma";
import { OrderStatus } from "@prisma/client";

export const createManufacturingOrderService = async (
  createdById: number,
  productId?: number,
  quantity?: number,
  scheduleStartDate?: string,
  deadline?: string
): Promise<{ id: number; status: OrderStatus; createdById: number }> => {
  const createData: any = { 
    status: OrderStatus.draft, 
    createdById
  };
  
  if (productId !== undefined) createData.productId = productId;
  if (quantity !== undefined) createData.quantity = quantity;
  if (scheduleStartDate) createData.scheduleStartDate = new Date(scheduleStartDate);
  if (deadline) createData.deadline = new Date(deadline);

  const mo = await prisma.manufacturingOrder.create({
    data: createData,
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
      createdById: moData.createdById,
      quantity: moData.quantity,
      status: "draft",
      // Conditionally include optional fields
      ...(moData.productId !== undefined && { productId: moData.productId }),
      ...(moData.scheduleStartDate !== undefined && { scheduleStartDate: moData.scheduleStartDate }),
      ...(moData.deadline !== undefined && { deadline: moData.deadline }),
      ...(moData.assignedToId !== undefined && { assignedToId: moData.assignedToId }),
    },
    create: {
      id: moData.id,
      createdById: moData.createdById,
      quantity: moData.quantity,
      status: "draft",
      // Conditionally include optional fields
      ...(moData.productId !== undefined && { productId: moData.productId }),
      ...(moData.scheduleStartDate !== undefined && { scheduleStartDate: moData.scheduleStartDate }),
      ...(moData.deadline !== undefined && { deadline: moData.deadline }),
      ...(moData.assignedToId !== undefined && { assignedToId: moData.assignedToId }),
    },
  });

  // Update BOM components if provided
  if (moData.bomIds && moData.bomIds.length > 0) {
    for (const bomId of moData.bomIds) {
      const bomData = moData.components?.find(comp => comp.id === bomId);
      if (bomData) {
        await prisma.billOfMaterial.update({
          where: { id: bomId },
          data: {
            componentId: bomData.componentId,
            quantity: bomData.quantity,
            ...(bomData.operation !== undefined && { operation: bomData.operation }),
            ...(bomData.opDurationMins !== undefined && { opDurationMins: bomData.opDurationMins }),
          },
        });
      }
    }
  }

  // Update work orders if provided
  if (moData.workOrderIds && moData.workOrderIds.length > 0) {
    for (const workOrderId of moData.workOrderIds) {
      const woData = moData.workOrders?.find(wo => wo.id === workOrderId);
      if (woData) {
        await prisma.workOrder.update({
          where: { id: workOrderId },
          data: {
            operation: woData.operation,
            status: woData.status,
            durationMins: woData.durationMins,
            ...(woData.comments !== undefined && { comments: woData.comments }),
            ...(woData.workCenterId !== undefined && { workCenterId: woData.workCenterId }),
            ...(woData.assignedToId !== undefined && { assignedToId: woData.assignedToId }),
            ...(woData.startedAt !== undefined && { startedAt: woData.startedAt }),
            ...(woData.completedAt !== undefined && { completedAt: woData.completedAt }),
            ...(woData.durationDoneMins !== undefined && { durationDoneMins: woData.durationDoneMins }),
          },
        });
      }
    }
  }

  return mo;
};

interface ComponentInput {
  id?: number; // BOM ID for updates
  componentId: number;
  quantity: number;
  operation?: string;
  opDurationMins?: number;
}

interface WorkOrderInput {
  id?: number; // Work Order ID for updates
  operation: string;
  status: "to_do" | "started" | "paused" | "completed";
  comments?: string;
  workCenterId?: number;
  assignedToId?: number;
  startedAt?: Date;
  completedAt?: Date;
  durationMins: number;
  durationDoneMins?: number;
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
  bomIds?: number[]; // List of BOM IDs to update
  workOrderIds?: number[]; // List of Work Order IDs to update
  status: string;
}
