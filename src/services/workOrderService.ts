import prisma from "../prisma";
import { WorkOrder, WorkStatus } from "@prisma/client";

export const createWorkOrderService = async (
  moId: number,
  operation: string,
  durationMins  : number,
  comments?: string,
): Promise<WorkOrder> => {
  const wo = await prisma.workOrder.create({
    data: {
      moId: moId,
      status: WorkStatus.to_do,
      operation: operation,
      durationMins: durationMins,
      comments: comments ? comments : "",
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
