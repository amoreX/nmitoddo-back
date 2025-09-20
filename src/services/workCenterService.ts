import prisma from "../prisma";
import { Role } from "@prisma/client";

export const createWorkCenterService = async ({
  name,
  location,
  capacityPerHour,
  costPerHour,
  createdById,
}: {
  name: string;
  location?: string;
  capacityPerHour?: number;
  costPerHour?: number;
  createdById: number;
}) => {
  // Validate user exists and has permission
  const user = await prisma.user.findUnique({ where: { id: createdById } });
  if (!user) {
    throw new Error("User not found");
  }

  // Check role permissions - only admin and manager can create work centers
  if (user.role === Role.user) {
    throw new Error("Not permitted: Only admin and manager roles can create work centers");
  }

  // Create the work center
  const workCenter = await prisma.workCenter.create({
    data: {
      name,
      createdById,
      // Optional fields - only include if provided
      ...(location !== undefined && { location }),
      ...(capacityPerHour !== undefined && { capacityPerHour }),
      ...(costPerHour !== undefined && { costPerHour }),
    },
  });

  return workCenter;
};