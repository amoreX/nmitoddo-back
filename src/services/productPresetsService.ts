import prisma from "../prisma";
import { Role } from "@prisma/client";

// Helper function to validate admin role
const validateAdminRole = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }
  if (user.role !== Role.admin) {
    throw new Error("Not permitted: Only admin users can manage product presets");
  }
  return user;
};

export const createProductPresetService = async ({
  name,
  description,
  unit,
  createdById,
}: {
  name: string;
  description?: string;
  unit?: string;
  createdById: number;
}) => {
  // Validate admin role
  await validateAdminRole(createdById);

  const productPreset = await prisma.productPresets.create({
    data: {
      name,
      createdById,
      // Optional fields
      ...(description !== undefined && { description }),
      ...(unit !== undefined && { unit }),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return productPreset;
};

export const getAllProductPresetsService = async (userId: number) => {
  // Validate admin role
  await validateAdminRole(userId);

  const productPresets = await prisma.productPresets.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return productPresets;
};

export const getProductPresetByIdService = async (id: number, userId: number) => {
  // Validate admin role
  await validateAdminRole(userId);

  const productPreset = await prisma.productPresets.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!productPreset) {
    throw new Error("Product preset not found");
  }

  return productPreset;
};

export const updateProductPresetService = async ({
  id,
  name,
  description,
  unit,
  userId,
}: {
  id: number;
  name?: string;
  description?: string;
  unit?: string;
  userId: number;
}) => {
  // Validate admin role
  await validateAdminRole(userId);

  // Check if preset exists
  const existingPreset = await prisma.productPresets.findUnique({ where: { id } });
  if (!existingPreset) {
    throw new Error("Product preset not found");
  }

  const updatedPreset = await prisma.productPresets.update({
    where: { id },
    data: {
      // Only update provided fields
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(unit !== undefined && { unit }),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return updatedPreset;
};

export const deleteProductPresetService = async (id: number, userId: number) => {
  // Validate admin role
  await validateAdminRole(userId);

  // Check if preset exists
  const existingPreset = await prisma.productPresets.findUnique({ where: { id } });
  if (!existingPreset) {
    throw new Error("Product preset not found");
  }

  await prisma.productPresets.delete({ where: { id } });

  return { message: "Product preset deleted successfully" };
};