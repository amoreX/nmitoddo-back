import prisma from "../prisma";
import { WorkStatus, OrderStatus } from "@prisma/client";

export const createWorkOrderService = async ({
  moId, operation, durationMins, comments, workCenterId
}: {
  moId: number,
  operation: string,
  durationMins: number,
  workCenterId: number,
  comments?: string,
}) => {
  // Validate input ID
  if (moId == null) throw new Error("moIdis required");
  // Validate Manufacturing Order exists
  const mo = await prisma.manufacturingOrder.findUnique({
    where: { id: moId },
  });
  if (!mo) throw new Error(`Manufacturing order ${moId} not found`);
  // Only allow WO if MO is not cancelled or done
  if (mo.status === OrderStatus.cancelled || mo.status === OrderStatus.done) {
    throw new Error('Cannot create work order for cancelled or completed manufacturing order');
  }
  const wo = await prisma.workOrder.create({
    data: {
      moId: moId,
      status: WorkStatus.to_do,
      operation: operation,
      durationMins: durationMins,
      comments: comments ? comments : "",
      workCenterId: workCenterId,
      // Optional defaults
      assignedToId: null,
      startedAt: null,
      completedAt: null,
    },
  });
  return wo;
};

// type WorkOrder = {
//   id: number;
//   operation: string;
//   status: $Enums.WorkStatus;
//   comments: string | null;
//   startedAt: Date | null;
//   completedAt: Date | null;
//   createdAt: Date;
//   moId: number;
//   workCenterId: number | null;
//   assignedToId: number | null;
// };
