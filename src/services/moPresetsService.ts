import prisma from "../prisma";
import { Role } from "@prisma/client";

// Helper function to validate user role
const validateAdminRole = (userRole: Role) => {
  if (userRole !== Role.admin) {
    throw new Error("Only admin users can manage MO presets");
  }
};

export const getAllMOPresetsService = async (userRole: Role) => {
  try {
    const moPresets = await prisma.mOPresets.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          include: {
            bom: {
              include: {
                component: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    description: true,
                  },
                },
              },
              orderBy: {
                id: 'asc',
              },
            },
            stock: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      status: true,
      message: "MO presets retrieved successfully",
      data: moPresets,
    };
  } catch (error: any) {
    console.error("Error getting MO presets:", error);
    return {
      status: false,
      message: "Failed to get MO presets",
      error: error.message,
    };
  }
};

export const getMOPresetByIdService = async (id: number, userRole: Role) => {
  try {
    const moPreset = await prisma.mOPresets.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          include: {
            bom: {
              include: {
                component: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    description: true,
                  },
                },
              },
              orderBy: {
                id: 'asc',
              },
            },
            stock: true,
            manufacturingOrders: {
              include: {
                workOrders: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 5, // Show last 5 MOs for reference
            },
          },
        },
      },
    });

    if (!moPreset) {
      return {
        status: false,
        message: "MO preset not found",
      };
    }

    return {
      status: true,
      message: "MO preset retrieved successfully",
      data: moPreset,
    };
  } catch (error: any) {
    console.error("Error getting MO preset:", error);
    return {
      status: false,
      message: "Failed to get MO preset",
      error: error.message,
    };
  }
};

export const createMOPresetService = async (
  data: {
    name: string;
    quantity: number;
    productId: number;
    description?: string;
  },
  createdById: number,
  userRole: Role
) => {
  try {
    validateAdminRole(userRole);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      return {
        status: false,
        message: "Product not found",
      };
    }

    const moPreset = await prisma.mOPresets.create({
      data: {
        name: data.name,
        quantity: data.quantity,
        productId: data.productId,
        createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          include: {
            bom: {
              include: {
                component: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      status: true,
      message: "MO preset created successfully",
      data: moPreset,
    };
  } catch (error: any) {
    console.error("Error creating MO preset:", error);
    return {
      status: false,
      message: "Failed to create MO preset",
      error: error.message,
    };
  }
};

export const updateMOPresetService = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    quantity?: number;
    productId?: number;
  },
  userRole: Role
) => {
  try {
    validateAdminRole(userRole);

    // Check if MO preset exists
    const existingPreset = await prisma.mOPresets.findUnique({
      where: { id },
    });

    if (!existingPreset) {
      return {
        status: false,
        message: "MO preset not found",
      };
    }

    // If productId is being updated, check if product exists
    if (data.productId) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        return {
          status: false,
          message: "Product not found",
        };
      }
    }

    const updatedPreset = await prisma.mOPresets.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          include: {
            bom: {
              include: {
                component: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      status: true,
      message: "MO preset updated successfully",
      data: updatedPreset,
    };
  } catch (error: any) {
    console.error("Error updating MO preset:", error);
    return {
      status: false,
      message: "Failed to update MO preset",
      error: error.message,
    };
  }
};

export const deleteMOPresetService = async (id: number, userRole: Role) => {
  try {
    validateAdminRole(userRole);

    // Check if MO preset exists
    const existingPreset = await prisma.mOPresets.findUnique({
      where: { id },
    });

    if (!existingPreset) {
      return {
        status: false,
        message: "MO preset not found",
      };
    }

    await prisma.mOPresets.delete({
      where: { id },
    });

    return {
      status: true,
      message: "MO preset deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting MO preset:", error);
    return {
      status: false,
      message: "Failed to delete MO preset",
      error: error.message,
    };
  }
};